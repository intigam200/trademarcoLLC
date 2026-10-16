import { describe, it, expect } from "vitest";
import { auditProducts, auditPages, landingPageCandidates } from "../src/lib/seoAudit/catalogAudit.js";

const base = (over) => ({
  id: over.id, status: "published", part_number: over.id, product_name: "Valve",
  manufacturer: { name: "X", slug: "x" },
  short_description: "A rotary control valve for general service in process plants, with long text.",
  long_description: "Long", image_url: "/i.png", ...over,
});

describe("auditProducts", () => {
  it("flags duplicate effective descriptions among published products only", () => {
    const { rows } = auditProducts([base({ id: "a" }), base({ id: "b" }), base({ id: "c", status: "draft" })]);
    expect(rows.find((r) => r.product.id === "a").issues).toContain("description_duplicate");
    expect(rows.find((r) => r.product.id === "c").issues).not.toContain("description_duplicate");
  });
  it("does not call a template title a duplicate when part numbers differ", () => {
    const { rows } = auditProducts([base({ id: "a" }), base({ id: "b" })]);
    expect(rows[0].issues).not.toContain("title_duplicate");
  });
  it("flags thin content, missing image, and template descriptions", () => {
    const { rows } = auditProducts([base({ id: "a", short_description: "", long_description: "", image_url: null })]);
    expect(rows[0].issues).toEqual(expect.arrayContaining(["content_thin", "no_image", "description_template"]));
    expect(rows[0].worst).toBe("medium");
  });
  it("flags published products whose manufacturer is not active", () => {
    const { rows } = auditProducts([base({ id: "a", manufacturer: { name: "F", slug: "f", status: "archived" } }), base({ id: "b", manufacturer: { name: "X", slug: "x", status: "active" } })]);
    expect(rows[0].issues).toContain("brand_inactive");
    expect(rows[0].worst).toBe("high");
    expect(rows[1].issues).not.toContain("brand_inactive");
  });
  it("only reports alt text and related links when that data exists", () => {
    const p = base({ id: "a" });
    expect(auditProducts([p]).rows[0].issues).not.toContain("alt_default");
    expect(auditProducts([p], { altSupported: true }).rows[0].issues).toContain("alt_default");
    expect(auditProducts([p], { relatedCounts: new Map() }).rows[0].issues).toContain("no_related");
  });
});

describe("auditPages / landingPageCandidates", () => {
  it("flags live pages with no products and no intro", () => {
    const [page] = auditPages([{ kind: "manufacturer", record: { name: "Empty", status: "active", logo_url: "/l.png" }, productCount: 0 }]);
    expect(page.issues).toEqual(expect.arrayContaining(["no_products", "description_template"]));
  });
  it("suggests brand x category pages only above the threshold", () => {
    const products = Array.from({ length: 12 }, (_, i) => base({ id: String(i), manufacturer: { name: "F", slug: "f" }, category: { name: "Valves", slug: "valves" } }));
    expect(landingPageCandidates(products)).toHaveLength(1);
    expect(landingPageCandidates(products.slice(1))).toHaveLength(0);
  });
});

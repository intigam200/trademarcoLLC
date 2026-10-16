import { describe, it, expect } from "vitest";
import { partFamily, sharedPartPrefix, suggestRelatedProducts, suggestArticleLinks, findBrokenInternalLinks } from "../src/lib/seoAudit/linking.js";

const p = (id, part, extra = {}) => ({
  id, part_number: part, slug: part.toLowerCase(), status: "published",
  manufacturer_id: "m", category_id: "c", manufacturer: { slug: "abb", name: "ABB" }, ...extra,
});

describe("linking", () => {
  it("derives part families", () => {
    expect(partFamily("3051CD2A")).toBe("3051");
    expect(partFamily("AXW900G")).toBe("axw900");
    expect(partFamily("EC")).toBeNull();
  });
  it("only treats long, numeric shared prefixes as a family", () => {
    expect(sharedPartPrefix("TU810V1", "TU811V1")).toBe("tu81");
    expect(sharedPartPrefix("3051CD", "3051S")).toBe("3051");
    expect(sharedPartPrefix("8580", "8532")).toBeNull();
    expect(sharedPartPrefix("AXW900", "AXW400")).toBeNull();
  });
  it("suggests same-family products with a reason and skips weak or existing ones", () => {
    const me = p("1", "TU810V1");
    const all = [me, p("2", "TU811V1"), p("3", "AI810"), p("4", "TU812V1", { manufacturer_id: "other" })];
    const out = suggestRelatedProducts(me, all, { existingIds: [] });
    expect(out.map((o) => o.product.id)).toEqual(["2"]);
    expect(out[0].reason).toMatch(/part-number family/);
    expect(suggestRelatedProducts(me, all, { existingIds: ["2"] })).toHaveLength(0);
  });
  it("suggests article links only for mentions not already linked", () => {
    const products = [p("1", "TU810V1")];
    const out = suggestArticleLinks("We source the TU810V1 and other ABB parts.", [], { products, manufacturers: [{ slug: "abb", name: "ABB", status: "active" }] });
    expect(out.map((o) => o.href)).toEqual(["/manufacturers/abb/tu810v1", "/manufacturers/abb"]);
    expect(suggestArticleLinks("TU810V1", ["/manufacturers/abb/tu810v1"], { products })).toHaveLength(0);
  });
  it("finds internal links to pages that do not exist", () => {
    const broken = findBrokenInternalLinks(
      ["/manufacturers/abb/tu810v1", "/manufacturers/abb/nope", "/#contact", "https://www.trademarco.com/products"],
      { products: [p("1", "TU810V1")] },
    );
    expect(broken).toEqual(["/manufacturers/abb/nope"]);
  });
});

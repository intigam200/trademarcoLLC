import { describe, it, expect } from "vitest";
import { evaluateArticle, extractPartNumberLike, HUMAN_CHECKS } from "../src/lib/seoAudit/contentChecklist.js";
import { buildBrief, briefToDraft } from "../src/lib/seoAudit/briefBuilder.js";

const products = [{ id: "p1", status: "published", part_number: "8580", product_name: "Butterfly Valve", slug: "8580", manufacturer: { slug: "fisher", name: "Fisher" }, manufacturer_id: "m1", category_id: "c1" }];
const manufacturers = [{ id: "m1", slug: "fisher", name: "Fisher", status: "active" }];
const categories = [{ id: "c1", slug: "valves", name: "Valves", status: "active" }];

const good = {
  id: "a1", slug: "butterfly-valve-selection", title: "Butterfly Valve Selection for Process Plants",
  primary_query: "butterfly valve selection",
  meta_description: "How to choose a butterfly valve for process service: sizing, seat materials, actuation and what to send for a quotation.",
  body_md: "Butterfly valve selection starts with the process conditions.\n\n## Seat materials\n\nSee the [Fisher 8580](/manufacturers/fisher/8580) for an example.\n\n## Requesting a quote\n\n[Request a quotation](/#contact)",
  sources: [{ url: "https://www.emerson.com/8580" }],
  review: Object.fromEntries(HUMAN_CHECKS.map((h) => [h.id, { by: "a", at: "2026-10-16" }])),
};
const ctx = { articles: [good], products, manufacturers, categories };
const state = (r, id) => r.checks.find((c) => c.id === id).state;

describe("evaluateArticle", () => {
  it("passes a complete, reviewed article and allows publishing", () => {
    const r = evaluateArticle(good, ctx);
    expect(r.checks.filter((c) => c.state === "fail")).toEqual([]);
    expect(r.canPublish).toBe(true);
    expect(r.scoreExplanation).toMatch(/not a Google ranking score/);
  });
  it("blocks publishing until every human check is signed off", () => {
    const r = evaluateArticle({ ...good, review: {} }, ctx);
    expect(r.canPublish).toBe(false);
    expect(r.checks.filter((c) => c.kind === "human").every((c) => c.state === "not_checked")).toBe(true);
  });
  it("fails broken internal links, missing alt text and leftover template notes", () => {
    const r = evaluateArticle({ ...good, body_md: `${good.body_md}\n\n[x](/manufacturers/fisher/nope)\n\n![](/i.png)\n\n[Write this section. Cite sources.]` }, ctx);
    expect(state(r, "internal_links")).toBe("fail");
    expect(state(r, "image_alt")).toBe("fail");
    expect(state(r, "placeholders")).toBe("fail");
    expect(r.canPublish).toBe(false);
  });
  it("fails when another article targets the same query", () => {
    const other = { ...good, id: "a2", slug: "other", title: "Something else" };
    expect(state(evaluateArticle(good, { ...ctx, articles: [good, other] }), "overlap_articles")).toBe("fail");
  });
  it("warns about unsupported claims and unknown model numbers", () => {
    const r = evaluateArticle({ ...good, body_md: `${good.body_md}\n\nWe are an authorized distributor with XYZ123 in stock.` }, ctx);
    expect(state(r, "risky_claims")).toBe("warning");
    expect(r.checks.find((c) => c.id === "part_numbers").detail).toMatch(/XYZ123/);
  });
  it("has no word-count requirement", () => {
    expect(evaluateArticle(good, ctx).checks.some((c) => /word count|minimum length|words long/i.test(`${c.label} ${c.detail}`))).toBe(false);
  });
  it("extracts part-number-like tokens", () => {
    expect(extractPartNumberLike("Use the 3051CD or TU810V1, not words.")).toEqual(["3051CD", "TU810V1"]);
  });
});

describe("buildBrief", () => {
  it("links only to real catalogue URLs and flags query overlap", () => {
    const brief = buildBrief({ query: "butterfly valve selection", intent: "commercial", manufacturerId: "m1", categoryId: "c1", productIds: ["p1"] }, { products, manufacturers, categories, articles: [good] });
    expect(brief.internalLinks.map((l) => l.href)).toEqual(expect.arrayContaining(["/manufacturers/fisher", "/products?category=valves", "/manufacturers/fisher/8580"]));
    expect(brief.overlapWarning).toMatch(/Butterfly Valve Selection/);
    expect(brief.method).toMatch(/Not AI-generated/);
    expect(brief.factsToVerify[0]).toMatch(/8580/);
  });
  it("produces a draft the checklist rejects until the notes are replaced", () => {
    const brief = buildBrief({ query: "plug valves" }, { products, manufacturers, categories, articles: [] });
    const r = evaluateArticle({ id: "n", slug: "plug-valves", title: brief.proposedTitle, body_md: briefToDraft(brief), primary_query: "plug valves" }, { ...ctx, articles: [] });
    expect(r.checks.find((c) => c.id === "placeholders").state).toBe("fail");
  });
});

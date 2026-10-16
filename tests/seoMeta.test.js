import { describe, it, expect } from "vitest";
import { productMeta, manufacturerMeta, categoryMeta, articleMeta, truncateAtWord } from "../src/lib/seoMeta.js";

const product = { part_number: "8580", product_name: "Butterfly Valve", manufacturer: { name: "Fisher" } };

describe("seoMeta", () => {
  it("prefers custom fields, then content, then template — and reports the source", () => {
    expect(productMeta({ ...product, seo_title: "Custom" })).toMatchObject({ title: "Custom", titleSource: "custom" });
    expect(productMeta(product)).toMatchObject({ title: "Fisher 8580 Butterfly Valve | Trademarco Global", titleSource: "template", descriptionSource: "template" });
    expect(productMeta({ ...product, short_description: " Rotary  valve. " })).toMatchObject({ description: "Rotary valve.", descriptionSource: "content" });
  });
  it("falls back to the product label for image alt", () => {
    expect(productMeta(product).imageAlt).toBe("Fisher 8580 Butterfly Valve");
    expect(productMeta({ ...product, image_alt: "Side view" })).toMatchObject({ imageAlt: "Side view", imageAltSource: "custom" });
  });
  it("uses the same chains for brands, categories and articles", () => {
    expect(manufacturerMeta({ name: "ABB", description: "Automation." }).description).toBe("Automation.");
    expect(categoryMeta({ name: "Valves", description: "short", full_description: "long" }).description).toBe("long");
    expect(articleMeta({ title: "T", excerpt: "E" })).toMatchObject({ title: "T | Trademarco Global", description: "E" });
  });
  it("truncates at a word boundary", () => {
    expect(truncateAtWord("alpha beta gamma delta", 15)).toBe("alpha beta…");
    expect(truncateAtWord("short", 15)).toBe("short");
  });
});

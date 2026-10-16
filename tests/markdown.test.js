import { describe, it, expect } from "vitest";
import { renderMarkdown, analyzeMarkdown, safeUrl } from "../src/lib/markdown.js";

describe("renderMarkdown — safety", () => {
  it("escapes raw HTML instead of passing it through", () => {
    const html = renderMarkdown('<script>alert(1)</script> <img src=x onerror=alert(1)>');
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
  });
  it("drops javascript: and data: links but keeps the text", () => {
    for (const src of ["[click](javascript:alert(1))", "[x](data:text/html,hi)", "![a](javascript:alert(1))", "[y](JaVaScRiPt:alert(1))"]) {
      const html = renderMarkdown(src);
      expect(html).not.toMatch(/href=|src=/);
      expect(html).toMatch(/^<p>(click|x|a|y)/);
    }
  });
  it("cannot break out of an attribute with quotes", () => {
    const html = renderMarkdown('[a](https://x.com/"onmouseover="alert(1))');
    expect(html).not.toMatch(/"\s*onmouseover=/);
  });
  it("rejects protocol-relative URLs", () => {
    expect(safeUrl("//evil.com")).toBeNull();
    expect(safeUrl("/products")).toBe("/products");
  });
});

describe("renderMarkdown — formatting", () => {
  it("renders headings, lists, emphasis and links", () => {
    const html = renderMarkdown("## Title\n\nSome **bold** and *it*.\n\n- one\n- two\n\n1. a\n2. b\n\n[Valves](/products?category=valves)");
    expect(html).toContain("<h2>Title</h2>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>it</em>");
    expect(html).toContain("<ul><li>one</li><li>two</li></ul>");
    expect(html).toContain("<ol><li>a</li><li>b</li></ol>");
    expect(html).toContain('<a href="/products?category=valves">Valves</a>');
  });
  it("opens external links in a new tab with rel=noopener, internal ones in place", () => {
    expect(renderMarkdown("[e](https://example.com)")).toContain('rel="noopener" target="_blank"');
    expect(renderMarkdown("[i](https://www.trademarco.com/x)")).not.toContain("target=");
  });
});

describe("analyzeMarkdown", () => {
  it("separates images from links and finds the first paragraph", () => {
    const a = analyzeMarkdown("> note\n\nFirst para about valves.\n\n## H\n\n![alt](/i.png) [p](/manufacturers/abb/x) [e](https://e.com)");
    expect(a.images).toEqual([{ alt: "alt", src: "/i.png" }]);
    expect(a.links.map((l) => [l.href, l.internal])).toEqual([["/manufacturers/abb/x", true], ["https://e.com", false]]);
    expect(a.firstParagraph).toBe("First para about valves.");
    expect(a.headings).toEqual([{ level: 2, text: "H" }]);
  });
});

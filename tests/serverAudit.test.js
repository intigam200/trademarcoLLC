import { describe, it, expect } from "vitest";
import { toAuditUrl } from "../api/_lib/auditUrl.js";
import { extractHtmlFacts } from "../api/_lib/htmlFacts.js";
import { analyzeAudit, linkTargetsToProbe } from "../src/lib/seoAudit/technicalAudit.js";
import { findOpportunities, totals } from "../src/lib/seoAudit/gscOpportunities.js";
import { isSearchEngineHost } from "../src/lib/trafficSource.js";

describe("toAuditUrl — SSRF guard", () => {
  it("allows only https://www.trademarco.com", () => {
    expect(toAuditUrl("/products")?.href).toBe("https://www.trademarco.com/products");
    expect(toAuditUrl("https://www.trademarco.com/a#frag")?.href).toBe("https://www.trademarco.com/a");
    for (const bad of ["http://www.trademarco.com/", "https://evil.com/", "https://169.254.169.254/latest/meta-data", "https://localhost/", "https://www.trademarco.com.evil.com/", "https://user:pw@www.trademarco.com/", "https://www.trademarco.com:8443/", "file:///etc/passwd", "javascript:alert(1)"]) {
      expect(toAuditUrl(bad)).toBeNull();
    }
  });
  it("resolves redirects relative to the current URL but still enforces the host", () => {
    expect(toAuditUrl("/next", "https://www.trademarco.com/a/b")?.href).toBe("https://www.trademarco.com/next");
    expect(toAuditUrl("//evil.com/x", "https://www.trademarco.com/")).toBeNull();
  });
});

const PAGE = `<!doctype html><html><head><title>A &amp; B</title><meta name="description" content="Desc"><link rel="canonical" href="https://www.trademarco.com/a">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization"},{"@type":"Product"}]}</script></head>
<body><h1>Heading</h1><a href="/b">b</a><a href='/c'>c</a><img src="/x.png"><img src="/y.png" alt=""><p>${"word ".repeat(100)}</p></body></html>`;

describe("extractHtmlFacts", () => {
  it("reads title, description, canonical, headings, links, images and JSON-LD", () => {
    const f = extractHtmlFacts(PAGE);
    expect(f.titles).toEqual(["A & B"]);
    expect(f.description).toBe("Desc");
    expect(f.canonicals).toEqual(["https://www.trademarco.com/a"]);
    expect(f.h1s).toEqual(["Heading"]);
    expect(f.links).toEqual(["/b", "/c"]);
    expect(f.images).toEqual([{ src: "/x.png", alt: null }, { src: "/y.png", alt: "" }]);
    expect(f.jsonLd).toEqual([{ valid: true, types: ["Organization", "Product"] }]);
  });
  it("reports invalid JSON-LD instead of throwing", () => {
    expect(extractHtmlFacts('<head><script type="application/ld+json">{bad</script></head>').jsonLd[0].valid).toBe(false);
  });
});

describe("analyzeAudit", () => {
  const plan = { urls: ["https://www.trademarco.com/a", "https://www.trademarco.com/b"], robots: { status: 200, blocksAll: false, declaredSitemaps: ["x"] }, sitemap: { status: 200, count: 2, invalid: [], duplicates: 0 } };
  const ok = (url, html) => ({ url, status: 200, chain: [{ url, status: 200 }], facts: extractHtmlFacts(html) });

  it("reports duplicates, missing alt, orphans, and marks unmeasurable checks honestly", () => {
    const results = [ok(plan.urls[0], PAGE), ok(plan.urls[1], PAGE.replace("https://www.trademarco.com/a", "https://www.trademarco.com/b"))];
    const { summary, findings } = analyzeAudit({ plan, results });
    expect(summary.title.state).toBe("warning");
    expect(summary.image_alt.state).toBe("warning");
    expect(findings.some((f) => f.check === "orphans" && f.url.endsWith("/a"))).toBe(true);
    expect(summary.google_index.state).toBe("unavailable");
    expect(summary.mobile_performance.state).toBe("not_checked");
  });
  it("fails noindex on a sitemap URL, and a 404 link target", () => {
    const results = [ok(plan.urls[0], PAGE.replace("<head>", '<head><meta name="robots" content="noindex">'))];
    const { summary } = analyzeAudit({ plan, results, linkStatus: new Map([["https://www.trademarco.com/c", 404]]) });
    expect(summary.robots_meta.state).toBe("fail");
    expect(summary.broken_links.state).toBe("fail");
    expect(linkTargetsToProbe(plan, results)).toEqual(["https://www.trademarco.com/c"]);
  });
});

describe("Search Console opportunities", () => {
  const row = (k, clicks, impressions, position) => ({ keys: [k], clicks, impressions, ctr: clicks / impressions, position });
  it("computes impression-weighted totals", () => {
    const t = totals([row("a", 10, 100, 2), row("b", 0, 300, 10)]);
    expect(t).toMatchObject({ clicks: 10, impressions: 400 });
    expect(t.position).toBeCloseTo(8);
  });
  it("finds low CTR relative to this site's own peers, page-two queries and declines", () => {
    const rows = [row("a", 30, 300, 4), row("b", 30, 300, 5), row("c", 33, 300, 6), row("low", 2, 300, 5), row("p2", 1, 200, 14)];
    const out = findOpportunities(rows, { previousRows: [row("a", 80, 300, 3)] });
    expect(out.find((o) => o.key === "low")?.type).toBe("low_ctr");
    expect(out.some((o) => o.key === "p2" && o.type === "striking_distance")).toBe(true);
    expect(out.some((o) => o.key === "a" && o.type === "declining")).toBe(true);
  });
});

describe("isSearchEngineHost", () => {
  it("recognises search engines and nothing else", () => {
    for (const h of ["www.google.com", "google.co.uk", "www.bing.com", "duckduckgo.com", "yandex.ru"]) expect(isSearchEngineHost(h)).toBe(true);
    for (const h of ["linkedin.com", "notgoogle.com.evil.io", "", null]) expect(isSearchEngineHost(h)).toBe(false);
  });
});

// Turns the per-page facts returned by /api/admin/seo-audit into check results.
// Pure, so it is unit-tested. States: pass | warning | fail | not_checked |
// unavailable. "unavailable" means the data source doesn't exist here (e.g.
// whether Google indexed a page) — never inferred from an HTTP 200.

export const TECH_CHECKS = {
  http_status: { label: "HTTP status", impact: "Sitemap URLs that don't return 200 waste crawl budget and can't be indexed.", fix: "Fix or remove the URL from the sitemap." },
  redirects: { label: "Redirects", impact: "Sitemap entries should be final URLs; chains slow crawling, loops and off-site hops break it.", fix: "List the final URL in the sitemap and link to it directly." },
  title: { label: "Title tag", impact: "Missing or duplicate titles make pages hard to tell apart in results.", fix: "Give every page one unique, descriptive <title>." },
  description: { label: "Meta description", impact: "Missing or duplicate descriptions lead Google to improvise the snippet.", fix: "Add a unique meta description to each page." },
  h1: { label: "H1 heading", impact: "A page without one clear H1 is harder for people and crawlers to understand.", fix: "Use exactly one H1 that names the page's subject." },
  canonical: { label: "Canonical tag", impact: "A missing or mismatched canonical can make Google index a different URL than intended.", fix: "Emit a self-referencing canonical on every indexable page." },
  robots_meta: { label: "Noindex directives", impact: "A sitemap URL marked noindex is a contradiction: it is submitted and excluded at once.", fix: "Remove noindex, or drop the URL from the sitemap." },
  crawler_html: { label: "Content in crawler HTML", impact: "Pages whose HTML has almost no text rely on Google rendering JavaScript to see anything.", fix: "Serve the page through the crawler renderer (api/render.js)." },
  structured_data: { label: "Structured data (JSON-LD)", impact: "Invalid JSON-LD is ignored by search engines.", fix: "Fix the JSON syntax in the page's ld+json block." },
  image_alt: { label: "Image alt text", impact: "Images without an alt attribute are inaccessible and can't be understood in image search.", fix: "Add descriptive alt text (empty alt only for purely decorative images)." },
  orphans: { label: "Orphan pages", impact: "Sitemap pages no crawled page links to are hard for crawlers to reach and value.", fix: "Link to them from related products, brand or category pages." },
  broken_links: { label: "Broken internal links", impact: "Links to missing pages frustrate visitors and waste crawl budget.", fix: "Update or remove the link." },
  robots_txt: { label: "robots.txt", impact: "A robots.txt blocking the site, or not declaring the sitemap, limits crawling.", fix: "Allow crawling and declare the sitemap." },
  sitemap: { label: "Sitemap", impact: "An unreachable or invalid sitemap delays discovery of new pages.", fix: "Serve a valid sitemap.xml with only canonical, on-site URLs." },
  mobile_performance: { label: "Mobile layout & performance", impact: "Measured by Google with real-browser lab tests, not by this crawler.", fix: "Test key pages in PageSpeed Insights (pagespeed.web.dev)." },
  google_index: { label: "Indexed in Google", impact: "Only Search Console knows which pages Google actually indexed. An HTTP 200 doesn't mean indexed.", fix: "Connect Search Console and use its Page indexing report." },
};

function normPath(href, base) {
  try {
    const u = new URL(href, base);
    if (u.hostname !== "www.trademarco.com") return null;
    u.hash = "";
    let s = u.href;
    if (u.pathname !== "/" && s.endsWith("/") && !u.search) s = s.slice(0, -1);
    return s;
  } catch {
    return null;
  }
}

function state(failures, warnings) {
  return failures ? "fail" : warnings ? "warning" : "pass";
}

// results: [{ url, status, error, chain, finalUrl, xRobots, prerendered, facts }]
// plan: { robots, sitemap, urls }   linkStatus: Map(url → status) for probed non-sitemap targets
export function analyzeAudit({ plan, results, linkStatus = new Map() }) {
  const findings = [];
  const add = (check, url, detail, level) => findings.push({ check, url, detail, level });
  const sitemapSet = new Set(plan.urls);
  const html = results.filter((r) => r.facts);

  for (const r of results) {
    if (r.error && !r.chain?.length) add("http_status", r.url, r.error, "fail");
    else if (r.status !== 200 && !(r.status >= 300 && r.status < 400)) add("http_status", r.url, `HTTP ${r.status || "error"}${r.error ? ` — ${r.error}` : ""}`, "fail");
    if (r.chain && r.chain.length > 1) add("redirects", r.url, r.error ? r.error : `Redirects ${r.chain.length - 1}× to ${r.finalUrl}`, r.error ? "fail" : "warning");
    if (r.xRobots && /noindex/i.test(r.xRobots)) add("robots_meta", r.url, `X-Robots-Tag: ${r.xRobots}`, "fail");
  }

  const titleUse = new Map();
  const descUse = new Map();
  for (const r of html) {
    const f = r.facts;
    if (!f.titles.length || !f.titles[0]) add("title", r.url, "No <title>", "fail");
    else {
      if (f.titles.length > 1) add("title", r.url, `${f.titles.length} <title> tags`, "warning");
      const t = f.titles[0].toLowerCase();
      titleUse.set(t, [...(titleUse.get(t) || []), r.url]);
    }
    if (!f.description) add("description", r.url, "No meta description", "fail");
    else {
      const d = f.description.toLowerCase();
      descUse.set(d, [...(descUse.get(d) || []), r.url]);
    }
    if (!f.h1s.length) add("h1", r.url, "No H1", "fail");
    else if (f.h1s.length > 1) add("h1", r.url, `${f.h1s.length} H1 headings`, "warning");

    if (!f.canonicals.length) add("canonical", r.url, "No canonical tag", "fail");
    else if (f.canonicals.length > 1) add("canonical", r.url, `${f.canonicals.length} canonical tags`, "fail");
    else if (normPath(f.canonicals[0], r.url) !== normPath(r.url, r.url)) add("canonical", r.url, `Canonical points elsewhere: ${f.canonicals[0]}`, "warning");

    if (f.robots && /noindex/i.test(f.robots)) add("robots_meta", r.url, `meta robots: ${f.robots}`, "fail");
    if (f.wordCount < 80) add("crawler_html", r.url, `${f.wordCount} words in the HTML crawlers receive${r.prerendered ? "" : " (not served by the crawler renderer)"}`, "warning");
    for (const j of f.jsonLd) if (!j.valid) add("structured_data", r.url, `Invalid JSON-LD: ${j.error}`, "fail");
    const noAlt = f.images.filter((i) => i.alt === null);
    if (noAlt.length) add("image_alt", r.url, `${noAlt.length} image(s) without an alt attribute`, "warning");
  }
  for (const [, urls] of titleUse) if (urls.length > 1) for (const u of urls) add("title", u, `Same title as ${urls.length - 1} other page(s)`, "warning");
  for (const [, urls] of descUse) if (urls.length > 1) for (const u of urls) add("description", u, `Same description as ${urls.length - 1} other page(s)`, "warning");

  // Link graph over the crawled HTML.
  const inbound = new Map();
  const targets = new Set();
  for (const r of html) {
    for (const href of r.facts.links) {
      const t = normPath(href, r.url);
      if (!t) continue;
      targets.add(t);
      if (t !== normPath(r.url, r.url)) inbound.set(t, (inbound.get(t) || 0) + 1);
    }
  }
  for (const u of plan.urls) {
    const n = normPath(u, u);
    if (n !== "https://www.trademarco.com/" && !inbound.get(n) && results.some((r) => r.url === u)) add("orphans", u, "No crawled page links here", "warning");
  }
  for (const t of targets) {
    const s = linkStatus.get(t);
    if (s === 404 || s === 410) {
      const from = html.filter((r) => r.facts.links.some((h) => normPath(h, r.url) === t)).map((r) => r.url);
      add("broken_links", t, `HTTP ${s}, linked from ${from.slice(0, 3).join(", ")}${from.length > 3 ? ` and ${from.length - 3} more` : ""}`, "fail");
    }
  }
  const unverifiedTargets = [...targets].filter((t) => !sitemapSet.has(t) && !linkStatus.has(t)).length;

  // Site-level checks.
  const robots = plan.robots;
  const robotsState = robots.status !== 200 ? "fail" : robots.blocksAll ? "fail" : robots.declaredSitemaps.length ? "pass" : "warning";
  const sm = plan.sitemap;
  const sitemapState = sm.status !== 200 ? "fail" : sm.invalid.length ? "fail" : sm.duplicates ? "warning" : sm.count ? "pass" : "fail";

  const summary = {};
  for (const id of Object.keys(TECH_CHECKS)) {
    const own = findings.filter((f) => f.check === id);
    const urls = new Set(own.map((f) => f.url));
    summary[id] = { ...TECH_CHECKS[id], state: state(own.filter((f) => f.level === "fail").length, own.filter((f) => f.level === "warning").length), affected: urls.size };
  }
  summary.robots_txt = { ...TECH_CHECKS.robots_txt, state: robotsState, affected: robotsState === "pass" ? 0 : 1, detail: robots.status !== 200 ? `HTTP ${robots.status}` : robots.blocksAll ? "Disallow: / for all crawlers" : robots.declaredSitemaps.length ? `Sitemap declared: ${robots.declaredSitemaps.join(", ")}` : "No Sitemap: line" };
  summary.sitemap = { ...TECH_CHECKS.sitemap, state: sitemapState, affected: sm.invalid.length + (sm.duplicates || 0), detail: sm.status !== 200 ? `HTTP ${sm.status}` : `${sm.count} URLs${sm.invalid.length ? `, ${sm.invalid.length} off-site or invalid` : ""}${sm.duplicates ? `, ${sm.duplicates} duplicates` : ""}` };
  summary.mobile_performance = { ...TECH_CHECKS.mobile_performance, state: "not_checked", affected: 0, detail: "Not measured by this crawler." };
  summary.google_index = { ...TECH_CHECKS.google_index, state: "unavailable", affected: 0, detail: "Requires Search Console." };
  if (unverifiedTargets) summary.broken_links.detail = `${unverifiedTargets} linked URL(s) outside the sitemap were not probed.`;
  for (const f of plan.sitemap.invalid) findings.push({ check: "sitemap", url: f, detail: "Not an https://www.trademarco.com URL", level: "fail" });
  return { summary, findings, pagesChecked: results.length };
}

// Internal link targets worth probing for status: on-site, not in the sitemap.
export function linkTargetsToProbe(plan, results, limit = 80) {
  const sitemapSet = new Set(plan.urls.map((u) => normPath(u, u)));
  const out = new Set();
  for (const r of results) {
    if (!r.facts) continue;
    for (const href of r.facts.links) {
      const t = normPath(href, r.url);
      if (t && !sitemapSet.has(t) && !/\/#/.test(href)) out.add(t);
    }
  }
  return [...out].slice(0, limit);
}

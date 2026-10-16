import { verifyAdmin } from "../_lib/verifyAdmin.js";
import { toAuditUrl, AUDIT_HOST } from "../_lib/auditUrl.js";
import { extractHtmlFacts } from "../_lib/htmlFacts.js";

// Server-side crawler behind the SEO Growth Center's Technical Audit. The
// browser can't fetch these pages itself (CORS), and it shouldn't see what a
// crawler sees anyway — this requests pages with a Googlebot-compatible user
// agent, so middleware.js serves the same HTML Google receives.
//
// Guard rails: admin-only; only https://www.trademarco.com (api/_lib/auditUrl.js);
// at most MAX_BATCH URLs per call, 4 at a time, 8s timeout each, 2MB body cap;
// redirects are followed by hand, within the host, at most MAX_HOPS deep.
// The client drives the crawl batch by batch, so no call runs long.

const USER_AGENT = "Mozilla/5.0 (compatible; TrademarcoSEOAudit/1.0; Googlebot-compatible; +https://www.trademarco.com)";
const TIMEOUT_MS = 8000;
const MAX_BATCH = 20;
const MAX_HOPS = 3;
const MAX_BYTES = 2 * 1024 * 1024;
const CONCURRENCY = 4;

async function fetchOnce(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "manual", signal: controller.signal, headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xml,text/plain" } });
    let body = "";
    if (res.status < 300 || res.status >= 400) {
      const buf = await res.arrayBuffer();
      body = Buffer.from(buf.byteLength > MAX_BYTES ? buf.slice(0, MAX_BYTES) : buf).toString("utf8");
    }
    return { status: res.status, location: res.headers.get("location"), contentType: res.headers.get("content-type") || "", xRobots: res.headers.get("x-robots-tag"), xPrerender: res.headers.get("x-prerender"), body, ms: Date.now() - started };
  } catch (err) {
    return { status: 0, error: err.name === "AbortError" ? `Timed out after ${TIMEOUT_MS / 1000}s` : err.message, ms: Date.now() - started };
  } finally {
    clearTimeout(timer);
  }
}

// Follows redirects manually so each hop can be checked against the host guard.
async function fetchFollowing(start) {
  const chain = [];
  let url = start;
  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const res = await fetchOnce(url.href);
    chain.push({ url: url.href, status: res.status });
    if (res.status >= 300 && res.status < 400 && res.location) {
      const next = toAuditUrl(res.location, url.href);
      if (!next) return { ...res, chain, redirectError: `Redirects off-site or to a disallowed URL: ${res.location}` };
      if (chain.some((c) => c.url === next.href)) return { ...res, chain, redirectError: "Redirect loop" };
      url = next;
      continue;
    }
    return { ...res, chain, finalUrl: url.href };
  }
  return { status: 0, chain, redirectError: `More than ${MAX_HOPS} redirects` };
}

async function mapLimited(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  }));
  return out;
}

export async function plan() {
  const [robots, sitemap] = await Promise.all([
    fetchOnce(`https://${AUDIT_HOST}/robots.txt`),
    fetchOnce(`https://${AUDIT_HOST}/sitemap.xml`),
  ]);

  const robotsText = robots.body || "";
  // Does the catch-all group block everything?
  const starGroup = robotsText.split(/\n(?=\s*user-agent\s*:)/i).find((g) => /user-agent\s*:\s*\*/i.test(g)) || "";
  const blocksAll = /^\s*disallow\s*:\s*\/\s*$/im.test(starGroup);
  const declaredSitemaps = [...robotsText.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].map((m) => m[1]);

  const locs = [...(sitemap.body || "").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
  const urls = [];
  const invalid = [];
  for (const loc of locs) {
    const u = toAuditUrl(loc);
    if (u && u.href === loc) urls.push(u.href);
    else invalid.push(loc);
  }

  return {
    robots: { status: robots.status, error: robots.error || null, blocksAll, declaredSitemaps, text: robotsText.slice(0, 4000) },
    sitemap: { status: sitemap.status, error: sitemap.error || null, contentType: sitemap.contentType || "", count: locs.length, invalid, duplicates: locs.length - new Set(locs).size },
    urls: [...new Set(urls)],
  };
}

export async function check(rawUrls) {
  const urls = rawUrls.slice(0, MAX_BATCH).map((u) => toAuditUrl(u)).filter(Boolean);
  return mapLimited(urls, CONCURRENCY, async (url) => {
    const res = await fetchFollowing(url);
    const isHtml = /text\/html/i.test(res.contentType || "");
    return {
      url: url.href,
      status: res.status,
      error: res.error || res.redirectError || null,
      chain: res.chain,
      finalUrl: res.finalUrl || null,
      ms: res.ms,
      xRobots: res.xRobots || null,
      prerendered: res.xPrerender === "bot",
      facts: isHtml && res.body ? extractHtmlFacts(res.body) : null,
    };
  });
}

// Status-only probe for internal link targets that aren't in the sitemap.
export async function status(rawUrls) {
  const urls = rawUrls.slice(0, MAX_BATCH * 2).map((u) => toAuditUrl(u)).filter(Boolean);
  return mapLimited(urls, CONCURRENCY, async (url) => {
    const res = await fetchOnce(url.href);
    return { url: url.href, status: res.status, error: res.error || null, location: res.location || null };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await verifyAdmin(req);
  if (!user) return res.status(401).json({ error: "Not authorized." });

  const { action, urls } = req.body || {};
  try {
    if (action === "plan") return res.status(200).json(await plan());
    if (action === "check" && Array.isArray(urls)) return res.status(200).json({ results: await check(urls) });
    if (action === "status" && Array.isArray(urls)) return res.status(200).json({ results: await status(urls) });
    return res.status(400).json({ error: "Unknown action." });
  } catch (err) {
    console.error("SEO audit failed:", err.message);
    return res.status(500).json({ error: "Audit request failed." });
  }
}

// One-off: announces every URL in the live sitemap to IndexNow (Bing, Yandex,
// Seznam, Naver). Day-to-day changes are announced by the daily cron that
// calls api/indexnow.js; run this after a site-wide change, or once for a new
// key. Engines treat repeated full submissions of unchanged URLs as noise, so
// don't put it on a schedule.
//
// Usage: node scripts/indexnow.js [--dry-run]

import { submitToIndexNow } from "../api/indexnow.js";

const SITEMAP_URL = "https://www.trademarco.com/sitemap.xml";

const xml = await (await fetch(SITEMAP_URL)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"));
console.log(`${urls.length} URLs in sitemap`);

if (process.argv.includes("--dry-run")) {
  console.log(urls.slice(0, 5).join("\n"), "\n…");
  process.exit(0);
}

const result = await submitToIndexNow(urls);
// 200 = accepted, 202 = accepted, key validation pending. 403 means the key
// file isn't reachable yet (deploy first), 422 means URLs don't match the host.
console.log("IndexNow response:", result.status, `(${result.submitted} URLs)`);

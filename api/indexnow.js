import { createClient } from "@supabase/supabase-js";

// Tells IndexNow engines (Bing, Yandex, Seznam, Naver) which URLs changed, so
// they recrawl within hours instead of on their own schedule. Bing's index is
// what ChatGPT search, Copilot and DuckDuckGo draw on. Google does not take
// part in IndexNow — for Google the sitemap's lastmod does this job.
//
// Runs daily from the cron in vercel.json and submits whatever changed in the
// last ~26 hours, so new products from the admin panel are announced without
// anyone remembering to. scripts/indexnow.js submits the whole sitemap once.

const SITE_URL = process.env.SITE_URL || "https://www.trademarco.com";
const HOST = new URL(SITE_URL).host;
// Public by design: IndexNow proves ownership by fetching this key back from
// /<key>.txt on the site, so it only has to match that file.
export const INDEXNOW_KEY = "42539e1b0ac62f004ca1421b3c2e9227";
const WINDOW_MS = 26 * 60 * 60 * 1000;

export async function submitToIndexNow(urls) {
  if (!urls.length) return { status: 200, submitted: 0 };
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key: INDEXNOW_KEY, keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`, urlList: urls.slice(0, 10000) }),
  });
  return { status: res.status, submitted: Math.min(urls.length, 10000) };
}

export default async function handler(req, res) {
  // Vercel's scheduler identifies itself this way. Not a secret — the worst a
  // spoofed call can do is resubmit the last day's changes — but it keeps
  // casual hits from repeatedly pinging the engines.
  if (!/vercel-cron/i.test(req.headers["user-agent"] || "")) {
    return res.status(403).send("Cron only.");
  }

  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const [{ data: products }, { data: manufacturers }] = await Promise.all([
      supabase.from("products").select("slug, manufacturer:manufacturers!inner ( slug )").eq("status", "published").gte("updated_at", since),
      supabase.from("manufacturers").select("slug").eq("status", "active").gte("updated_at", since),
    ]);

    const urls = [
      ...(manufacturers ?? []).map((m) => `${SITE_URL}/manufacturers/${m.slug}`),
      ...(products ?? []).map((p) => `${SITE_URL}/manufacturers/${p.manufacturer.slug}/${p.slug}`),
    ];
    // Listing pages change whenever anything in them does.
    if (urls.length) urls.push(`${SITE_URL}/`, `${SITE_URL}/products`, `${SITE_URL}/manufacturers`);

    const result = await submitToIndexNow(urls);
    console.log("IndexNow:", result);
    return res.status(200).json(result);
  } catch (err) {
    console.error("IndexNow submit failed:", err.message);
    return res.status(500).send("Submit failed.");
  }
}

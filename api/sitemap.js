import { createClient } from "@supabase/supabase-js";

const SITE_URL = process.env.SITE_URL || "https://www.trademarco.com";

// The day crawlers started receiving server-rendered pages (middleware.js).
// Before it, every catalogue URL served Google the same empty shell, so a page
// last edited in the database earlier than this still genuinely changed on
// this date as far as a crawler is concerned. Raise this again only when the
// HTML crawlers receive changes site-wide — Google stops trusting lastmod that
// moves without the page changing.
const RENDER_CHANGED = "2026-10-07";

function lastmodFor(value) {
  const date = new Date(value).toISOString().slice(0, 10);
  return date > RENDER_CHANGED ? date : RENDER_CHANGED;
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${SITE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmodFor(lastmod)}</lastmod>` : null,
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : null,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

// Public, read-only sitemap — uses the anon key (same access a browser has)
// since it only ever needs to see active/published rows, same as the site.
export default async function handler(req, res) {
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    const [{ data: manufacturers }, { data: products }, { data: categories }, { data: articles }] = await Promise.all([
      supabase.from("manufacturers").select("slug, updated_at").eq("status", "active"),
      supabase.from("products").select("slug, updated_at, manufacturer:manufacturers(slug)").eq("status", "published"),
      supabase.from("categories").select("slug, updated_at").eq("status", "active"),
      // Any error — e.g. the articles table not created yet — leaves data
      // null: no article URLs, nothing else affected.
      supabase.from("articles").select("slug, updated_at").eq("status", "published"),
    ]);

    const urls = [
      { loc: "/", lastmod: RENDER_CHANGED, changefreq: "daily", priority: "1.0" },
      { loc: "/company", changefreq: "monthly", priority: "0.5" },
      { loc: "/products", lastmod: RENDER_CHANGED, changefreq: "daily", priority: "0.8" },
      { loc: "/manufacturers", lastmod: RENDER_CHANGED, changefreq: "weekly", priority: "0.8" },
      { loc: "/industries", lastmod: RENDER_CHANGED, changefreq: "monthly", priority: "0.7" },
      { loc: "/privacy-policy", changefreq: "yearly", priority: "0.3" },
      { loc: "/terms-of-service", changefreq: "yearly", priority: "0.3" },
      { loc: "/cookie-policy", changefreq: "yearly", priority: "0.3" },
      ...(categories ?? []).map((c) => ({ loc: `/products?category=${c.slug}`, lastmod: c.updated_at, changefreq: "weekly", priority: "0.7" })),
      ...(manufacturers ?? []).map((m) => ({ loc: `/manufacturers/${m.slug}`, lastmod: m.updated_at, changefreq: "weekly", priority: "0.7" })),
      ...(products ?? [])
        .filter((p) => p.manufacturer?.slug)
        .map((p) => ({ loc: `/manufacturers/${p.manufacturer.slug}/${p.slug}`, lastmod: p.updated_at, changefreq: "weekly", priority: "0.6" })),
      // The listing is only indexable once it has something on it.
      ...(articles?.length ? [{ loc: "/articles", lastmod: articles.map((a) => a.updated_at).sort().at(-1), changefreq: "weekly", priority: "0.6" }] : []),
      ...(articles ?? []).map((a) => ({ loc: `/articles/${a.slug}`, lastmod: a.updated_at, changefreq: "monthly", priority: "0.6" })),
    ];

    const body = urls.map(urlEntry).join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

    res.setHeader("Content-Type", "application/xml");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(xml);
  } catch (err) {
    console.error("Sitemap generation failed:", err);
    return res.status(500).send("Could not generate sitemap.");
  }
}

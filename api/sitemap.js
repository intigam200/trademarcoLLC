import { createClient } from "@supabase/supabase-js";

// trademarco.com's DNS isn't pointed at this deployment yet — see SITE_URL
// in src/lib/seo.js for the full explanation. Set SITE_URL once DNS is fixed.
const SITE_URL = process.env.SITE_URL || "https://trademarco-llc.vercel.app";

function urlEntry({ loc, lastmod, priority }) {
  return [
    "  <url>",
    `    <loc>${SITE_URL}${loc}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].filter(Boolean).join("\n");
}

// Public, read-only sitemap — uses the anon key (same access a browser has)
// since it only ever needs to see active/published rows, same as the site.
export default async function handler(req, res) {
  try {
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    const [{ data: manufacturers }, { data: products }] = await Promise.all([
      supabase.from("manufacturers").select("slug, updated_at").eq("status", "active"),
      supabase.from("products").select("slug, updated_at, manufacturer:manufacturers(slug)").eq("status", "published"),
    ]);

    const urls = [
      { loc: "/", priority: "1.0" },
      { loc: "/company", priority: "0.5" },
      { loc: "/products", priority: "0.8" },
      { loc: "/manufacturers", priority: "0.8" },
      { loc: "/privacy-policy", priority: "0.3" },
      { loc: "/terms-of-service", priority: "0.3" },
      { loc: "/cookie-policy", priority: "0.3" },
      ...(manufacturers ?? []).map((m) => ({ loc: `/manufacturers/${m.slug}`, lastmod: m.updated_at, priority: "0.7" })),
      ...(products ?? [])
        .filter((p) => p.manufacturer?.slug)
        .map((p) => ({ loc: `/manufacturers/${p.manufacturer.slug}/${p.slug}`, lastmod: p.updated_at, priority: "0.6" })),
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

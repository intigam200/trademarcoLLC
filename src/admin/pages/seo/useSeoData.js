import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import { isMissingSchema } from "../../../lib/supabase/schemaStatus";

// Loads everything the SEO Growth Center audits, straight from the database
// the site runs on. Reads in pages because Supabase caps a single response at
// 1000 rows and the catalogue is already past 500 products.
const PAGE = 1000;

async function readAll(build) {
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) return { data: out, error };
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) return { data: out, error: null };
  }
}

export async function loadSeoData() {
  const [products, manufacturers, categories, related, articles, altProbe, rfqProbe, auditRuns] = await Promise.all([
    readAll(() => supabase.from("products").select("*, manufacturer:manufacturers ( id, slug, name, status ), category:categories ( id, slug, name )").order("part_number")),
    supabase.from("manufacturers").select("*").order("name"),
    supabase.from("categories").select("*").order("name"),
    readAll(() => supabase.from("product_related").select("product_id, related_product_id")),
    supabase.from("articles").select("*").order("updated_at", { ascending: false }),
    supabase.from("products").select("image_alt").limit(1),
    supabase.from("rfqs").select("landing_referrer").limit(1),
    supabase.from("seo_audit_runs").select("id, started_at, finished_at, pages_checked, summary").order("started_at", { ascending: false }).limit(10),
  ]);

  for (const r of [products, manufacturers, categories, related]) {
    if (r.error) throw r.error;
  }
  if (articles.error && !isMissingSchema(articles.error)) throw articles.error;

  const relatedCounts = new Map();
  for (const r of related.data) relatedCounts.set(r.product_id, (relatedCounts.get(r.product_id) || 0) + 1);

  return {
    products: products.data,
    manufacturers: manufacturers.data ?? [],
    categories: categories.data ?? [],
    related: related.data,
    relatedCounts,
    articles: articles.data ?? [],
    migration: {
      articles: !isMissingSchema(articles.error),
      imageAlt: !isMissingSchema(altProbe.error),
      rfqSource: !isMissingSchema(rfqProbe.error),
      auditRuns: !isMissingSchema(auditRuns.error),
    },
    auditRuns: auditRuns.error ? [] : auditRuns.data ?? [],
    loadedAt: new Date(),
  };
}

export function useSeoData() {
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: "" }));
    loadSeoData()
      .then((data) => setState({ loading: false, error: "", data }))
      .catch((err) => setState({ loading: false, error: err.message || "Could not load SEO data.", data: null }));
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}

// RFQs whose visit arrived from a search engine, by first-touch referrer.
export async function countSearchRfqs(sinceIso, isSearchEngineHost) {
  const { data, error } = await supabase.from("rfqs").select("landing_referrer, landing_page, utm_medium, created_at").gte("created_at", sinceIso);
  if (error) return { error };
  const rows = data ?? [];
  // landing_page is recorded for every tracked visit, including direct ones
  // (no referrer), so it marks which RFQs carry source data at all.
  const withSource = rows.filter((r) => r.landing_page);
  const organic = rows.filter((r) => isSearchEngineHost(r.landing_referrer) && !/cpc|paid|ppc/i.test(r.utm_medium || ""));
  return { total: rows.length, tracked: withSource.length, organic: organic.length };
}

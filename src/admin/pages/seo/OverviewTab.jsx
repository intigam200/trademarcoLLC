import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_COLORS } from "../../theme";
import { auditProducts, auditPages, PRODUCT_CHECKS, PAGE_CHECKS, SEVERITY_ORDER } from "../../../lib/seoAudit/catalogAudit";
import { analyzeMarkdown } from "../../../lib/markdown";
import { totals, findOpportunities } from "../../../lib/seoAudit/gscOpportunities";
import { isSearchEngineHost } from "../../../lib/trafficSource";
import { gscStatus, gscQuery } from "../../lib/adminApi";
import { countSearchRfqs } from "./useSeoData";
import { gscRange } from "./gscDates";
import { Kpi, KpiGrid, SectionTitle, SeverityBadge, Empty, card, btn } from "./ui";

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function OverviewTab({ data }) {
  const productAudit = useMemo(() => auditProducts(data.products, { relatedCounts: data.relatedCounts, altSupported: data.migration.imageAlt }), [data]);
  const pageAudit = useMemo(() => {
    const counts = new Map();
    for (const p of data.products) {
      if (p.status !== "published") continue;
      counts.set(`m:${p.manufacturer_id}`, (counts.get(`m:${p.manufacturer_id}`) || 0) + 1);
      counts.set(`c:${p.category_id}`, (counts.get(`c:${p.category_id}`) || 0) + 1);
    }
    return auditPages([
      ...data.manufacturers.map((m) => ({ kind: "manufacturer", record: m, productCount: counts.get(`m:${m.id}`) || 0 })),
      ...data.categories.map((c) => ({ kind: "category", record: c, productCount: counts.get(`c:${c.id}`) || 0 })),
    ]);
  }, [data]);

  const [gsc, setGsc] = useState({ state: "loading" });
  const [rfq, setRfq] = useState(null);

  useEffect(() => {
    let cancelled = false;
    gscStatus()
      .then(async (status) => {
        if (!status.connected) { if (!cancelled) setGsc({ state: "disconnected", status }); return; }
        const range = gscRange(28);
        const [all, queries] = await Promise.all([
          gscQuery({ ...range, dimension: "none" }),
          gscQuery({ ...range, dimension: "query" }),
        ]);
        if (!cancelled) setGsc({ state: "connected", totals: totals(all), opportunities: findOpportunities(queries), range });
      })
      .catch((err) => { if (!cancelled) setGsc({ state: "error", error: err.message }); });

    if (data.migration.rfqSource) {
      const since = new Date(Date.now() - 28 * 864e5).toISOString();
      countSearchRfqs(since, isSearchEngineHost).then((r) => { if (!cancelled) setRfq(r); });
    }
    return () => { cancelled = true; };
  }, [data.migration.rfqSource]);

  const published = data.products.filter((p) => p.status === "published");
  const missingCustomMeta = productAudit.rows.filter((r) => r.product.status === "published" && (r.meta.titleSource !== "custom" || r.meta.descriptionSource !== "custom")).length;
  const duplicateMeta = productAudit.rows.filter((r) => r.issues.includes("title_duplicate") || r.issues.includes("description_duplicate")).length;
  const lastRun = data.auditRuns[0];
  const lastRunIssues = lastRun ? Object.values(lastRun.summary || {}).filter((s) => s.state === "fail" || s.state === "warning").reduce((n, s) => n + (s.affected || 0), 0) : null;
  const publishedArticles = data.articles.filter((a) => a.status === "published");

  // ── Highest priority actions, all derived from detected facts ─────────────
  const actions = [];
  for (const [id, def] of Object.entries(PRODUCT_CHECKS)) {
    const count = productAudit.counts[id];
    if (!count) continue;
    actions.push({ key: `p-${id}`, severity: def.severity, title: def.label, detected: `${count} product page${count === 1 ? "" : "s"}`, count, impact: def.impact, fix: def.fix, to: `/admin/seo/products?issue=${id}`, source: "Database" });
  }
  const pageIssueCounts = {};
  for (const p of pageAudit) for (const i of p.issues) pageIssueCounts[i] = (pageIssueCounts[i] || 0) + 1;
  for (const [id, count] of Object.entries(pageIssueCounts)) {
    const def = PAGE_CHECKS[id];
    actions.push({ key: `g-${id}`, severity: def.severity, title: `${def.label} (brand/category pages)`, detected: `${count} page${count === 1 ? "" : "s"}`, count, impact: def.impact, fix: def.fix, to: `/admin/seo/pages?issue=${id}`, source: "Database" });
  }
  const articlesNoCatalog = publishedArticles.filter((a) => !analyzeMarkdown(a.body_md).links.some((l) => l.internal && /\/(manufacturers|products)/.test(l.href)));
  if (articlesNoCatalog.length) {
    actions.push({ key: "a-nolinks", severity: "medium", title: "Articles without catalogue links", detected: `${articlesNoCatalog.length} published article${articlesNoCatalog.length === 1 ? "" : "s"}`, count: articlesNoCatalog.length, impact: "Readers have no route from the article to a product or quote request.", fix: "Add links to the relevant product, brand or category pages.", to: "/admin/seo/content", source: "Database" });
  }
  if (lastRun) {
    for (const [checkId, s] of Object.entries(lastRun.summary || {})) {
      if (s.state !== "fail" || !s.affected) continue;
      actions.push({ key: `t-${checkId}`, severity: "high", title: s.label || checkId, detected: `${s.affected} URL${s.affected === 1 ? "" : "s"}`, count: s.affected, impact: s.impact || "Found by the technical audit.", fix: s.fix || "See the audit details.", to: "/admin/seo/audit", source: `Audit ${new Date(lastRun.started_at).toLocaleDateString()}` });
    }
  }
  if (gsc.state === "connected") {
    const lowCtr = gsc.opportunities.filter((o) => o.type === "low_ctr" || o.type === "no_clicks");
    if (lowCtr.length) actions.push({ key: "gsc-ctr", severity: "medium", title: "High impressions, low CTR", detected: `${lowCtr.length} quer${lowCtr.length === 1 ? "y" : "ies"}`, count: lowCtr.length, impact: "Pages are shown in results but searchers rarely choose them.", fix: "Rewrite titles and descriptions for those landing pages.", to: "/admin/seo/performance", source: "Search Console" });
    const striking = gsc.opportunities.filter((o) => o.type === "striking_distance");
    if (striking.length) actions.push({ key: "gsc-pos", severity: "low", title: "Queries ranking on page two", detected: `${striking.length} quer${striking.length === 1 ? "y" : "ies"}`, count: striking.length, impact: "Positions 11–20 get few clicks; small improvements can move them to page one.", fix: "Strengthen the ranking page's content and internal links.", to: "/admin/seo/performance", source: "Search Console" });
  }
  actions.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.count - a.count);

  const gscValue = (fn) => (gsc.state === "connected" ? fn(gsc.totals) : "—");
  const gscNote = gsc.state === "connected" ? `${gsc.range.startDate} – ${gsc.range.endDate}` : gsc.state === "loading" ? "Checking connection…" : "Search Console not connected";

  return (
    <div>
      <KpiGrid>
        <Kpi label="Published articles" value={data.migration.articles ? publishedArticles.length : "—"} note={data.migration.articles ? `${data.articles.length - publishedArticles.length} in draft` : "Migration not applied"} />
        <Kpi label="Catalogue products" value={data.products.length} note={`${published.length} published`} />
        <Kpi label="Without custom SEO title or description" value={missingCustomMeta} note="Published products using a template or product text" tone={missingCustomMeta ? "warn" : undefined} />
        <Kpi label="Duplicate title or description" value={duplicateMeta} note="Among published products" tone={duplicateMeta ? "bad" : undefined} />
        <Kpi label="Technical issues" value={lastRunIssues ?? "—"} note={lastRun ? `Last audit ${new Date(lastRun.started_at).toLocaleDateString()}` : "No audit saved yet"} tone={lastRunIssues ? "warn" : undefined} />
        <Kpi label="Google impressions" value={gscValue((t) => t.impressions.toLocaleString())} note={gscNote} />
        <Kpi label="Google clicks" value={gscValue((t) => t.clicks.toLocaleString())} note={gscNote} />
        <Kpi label="Organic CTR" value={gscValue((t) => pct(t.ctr))} note={gscNote} />
        <Kpi label="Average position" value={gscValue((t) => t.position.toFixed(1))} note={gscNote} />
        <Kpi
          label="RFQs from search visits"
          value={rfq && !rfq.error ? rfq.organic : "—"}
          note={!data.migration.rfqSource ? "Source tracking needs the migration" : rfq && !rfq.error ? `Last 28 days, ${rfq.tracked} of ${rfq.total} RFQs carry source data. First-touch referrer, not proof the search caused the RFQ.` : "Loading…"}
        />
      </KpiGrid>

      <SectionTitle>Highest priority actions</SectionTitle>
      <p style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray, margin: "-4px 0 12px" }}>
        <strong>Detected</strong> is a fact found in the data; <strong>Recommended fix</strong> is advice. Severity reflects likely impact on how pages appear in search, not a ranking forecast.
      </p>
      {actions.length === 0 ? (
        <Empty>No issues detected in the catalogue data. Run the Technical Audit to check the live pages too.</Empty>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {actions.slice(0, 12).map((a) => (
            <div key={a.key} style={{ ...card, padding: 16, display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                  <SeverityBadge severity={a.severity} />
                  <strong style={{ fontSize: 14, color: ADMIN_COLORS.navy }}>{a.title}</strong>
                  <span style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray }}>· source: {a.source}</span>
                </div>
                <div style={{ fontSize: 13, color: ADMIN_COLORS.darkGray, lineHeight: 1.55 }}>
                  <div><strong>Detected:</strong> {a.detected}</div>
                  <div><strong>Impact:</strong> {a.impact}</div>
                  <div><strong>Recommended fix:</strong> {a.fix}</div>
                </div>
              </div>
              <Link to={a.to} style={{ ...btn.secondary, textDecoration: "none" }}>Review</Link>
            </div>
          ))}
        </div>
      )}

      {gsc.state === "disconnected" && (
        <p style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray, marginTop: 16 }}>
          Search metrics appear once Search Console is connected — see <Link to="/admin/seo/settings" style={{ color: ADMIN_COLORS.accent }}>Settings &amp; Integrations</Link>.
        </p>
      )}
      {gsc.state === "error" && <p style={{ fontSize: 12.5, color: ADMIN_COLORS.danger, marginTop: 16 }}>Search Console: {gsc.error}</p>}
    </div>
  );
}

import { useEffect, useState } from "react";
import { ADMIN_COLORS } from "../../theme";
import { seoAuditPlan, gscStatus } from "../../lib/adminApi";
import { ORG_NAME, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX } from "../../../lib/seoMeta";
import { HUMAN_CHECKS } from "../../../lib/seoAudit/contentChecklist";
import { MIGRATION_FILE } from "../../../lib/supabase/schemaStatus";
import GscSetup from "./GscSetup";
import { StateBadge, SectionTitle, Loading, card } from "./ui";

function Row({ label, state, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(160px, 220px) auto minmax(0, 1fr)", gap: 12, alignItems: "start", padding: "12px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}`, fontSize: 13 }}>
      <strong style={{ color: ADMIN_COLORS.navy }}>{label}</strong>
      <span>{state && <StateBadge state={state} />}</span>
      <div style={{ color: ADMIN_COLORS.darkGray, lineHeight: 1.55, minWidth: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsTab({ data }) {
  const [plan, setPlan] = useState(null);
  const [gsc, setGsc] = useState(null);

  useEffect(() => {
    seoAuditPlan().then(setPlan).catch((err) => setPlan({ error: err.message }));
    gscStatus().then(setGsc).catch((err) => setGsc({ connected: false, error: err.message }));
  }, []);

  const lastRun = data.auditRuns[0];
  const m = data.migration;
  const migrationParts = [["articles table", m.articles], ["audit history table", m.auditRuns], ["products.image_alt", m.imageAlt], ["RFQ traffic-source columns", m.rfqSource]];

  return (
    <div>
      <div style={{ ...card }}>
        <Row label="Canonical domain" state="pass">
          <code>https://www.trademarco.com</code> — every canonical tag, sitemap URL and structured-data URL uses this host; the bare domain redirects to it. Changing it is a site-wide migration, so it isn&rsquo;t editable here.
        </Row>
        <Row label="Sitemap" state={!plan ? null : plan.error ? "unavailable" : plan.sitemap.status === 200 && !plan.sitemap.invalid.length ? "pass" : "fail"}>
          {!plan ? "Checking…" : plan.error ? plan.error : <><a href="https://www.trademarco.com/sitemap.xml" target="_blank" rel="noreferrer" style={{ color: ADMIN_COLORS.accent }}>/sitemap.xml</a> — HTTP {plan.sitemap.status}, {plan.sitemap.count} URLs. Generated live from the database, so published products, brands, categories and articles appear automatically.</>}
        </Row>
        <Row label="robots.txt" state={!plan ? null : plan.error ? "unavailable" : plan.robots.status === 200 && !plan.robots.blocksAll ? "pass" : "fail"}>
          {!plan ? "Checking…" : plan.error ? plan.error : <>HTTP {plan.robots.status}. {plan.robots.blocksAll ? "Blocks all crawlers!" : "Crawling allowed; /admin disallowed."} Sitemap declared: {plan.robots.declaredSitemaps.join(", ") || "no"}.</>}
        </Row>
        <Row label="Google Search Console" state={!gsc ? null : gsc.connected ? "pass" : "not_checked"}>
          {!gsc ? "Checking…" : gsc.connected ? <>Connected to <code>{gsc.property}</code> as <code>{gsc.serviceAccount}</code>.</> : "Not connected — setup steps below."}
        </Row>
        <Row label="Analytics" state="pass">
          Vercel Web Analytics is installed on the public site (page views, referrers). Its data is viewed in the Vercel dashboard; there is no API connection to this admin.
        </Row>
        <Row label="IndexNow (Bing, Yandex)" state="pass">
          Daily at 06:00 UTC a scheduled job announces products and brands changed in the last day. Google does not use IndexNow.
        </Row>
        <Row label="Technical audit schedule" state="not_checked">
          Manual — run it from the Technical Audit tab. {lastRun ? `Last run ${new Date(lastRun.started_at).toLocaleString()} (${lastRun.pages_checked} pages).` : "No saved run yet."} Scheduled audits aren&rsquo;t set up: the free Vercel plan allows few cron jobs and one is used by IndexNow.
        </Row>
        <Row label="Database migration" state={migrationParts.every(([, ok]) => ok) ? "pass" : "warning"}>
          {migrationParts.map(([label, ok]) => <div key={label}>{ok ? "✓" : "✗"} {label}</div>)}
          {!migrationParts.every(([, ok]) => ok) && <div style={{ marginTop: 4 }}>Run <code>{MIGRATION_FILE}</code> in Supabase → SQL Editor.</div>}
        </Row>
      </div>

      <SectionTitle>Default metadata rules</SectionTitle>
      <div style={{ ...card, fontSize: 13, lineHeight: 1.65 }}>
        <p style={{ margin: "0 0 8px" }}>Used whenever a page has no custom SEO field. The same rules drive the live pages, the HTML search engines receive, and every audit here (<code>src/lib/seoMeta.js</code>).</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          <li><strong>Product title:</strong> “Manufacturer Part-number Product name | {ORG_NAME}”</li>
          <li><strong>Product description:</strong> custom → short description → “Request a quote for … from {ORG_NAME}.”</li>
          <li><strong>Brand title:</strong> “Brand Industrial Products | {ORG_NAME}”; description: custom → brand description → template</li>
          <li><strong>Category title:</strong> “Category | Industrial Products | {ORG_NAME}”; description: custom → full description → description → template</li>
          <li><strong>Article title:</strong> meta title → “Title | {ORG_NAME}”; description: meta description → excerpt</li>
          <li><strong>Length guidance:</strong> titles ≈ {TITLE_MAX} characters, descriptions {DESCRIPTION_MIN}–{DESCRIPTION_MAX}. Google truncates by pixel width, so these are guidance.</li>
        </ul>
      </div>

      <SectionTitle>Content approval</SectionTitle>
      <div style={{ ...card, fontSize: 13, lineHeight: 1.65 }}>
        <p style={{ margin: "0 0 8px" }}>Articles are never published automatically or in bulk. Publishing requires an administrator to press Publish, and is only enabled when no automated check fails and these reviewer sign-offs are recorded:</p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>{HUMAN_CHECKS.map((h) => <li key={h.id}>{h.label}</li>)}</ul>
        <p style={{ margin: "8px 0 0", color: ADMIN_COLORS.medGray }}>Product and page SEO edits always go through a review-changes step and a confirmation before they reach the live site.</p>
      </div>

      <SectionTitle>Search Console setup</SectionTitle>
      {!gsc ? <Loading /> : gsc.connected ? <div style={{ ...card, fontSize: 13 }}>Connected. Nothing to set up.</div> : <GscSetup status={gsc} />}
    </div>
  );
}

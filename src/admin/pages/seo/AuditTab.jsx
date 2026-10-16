import { Fragment, useRef, useState } from "react";
import { ADMIN_COLORS } from "../../theme";
import { supabase } from "../../../lib/supabase/client";
import { seoAuditPlan, seoAuditCheck, seoAuditStatus } from "../../lib/adminApi";
import { analyzeAudit, linkTargetsToProbe, TECH_CHECKS } from "../../../lib/seoAudit/technicalAudit";
import { StateBadge, SectionTitle, Notice, MigrationNotice, Empty, table, btn, card } from "./ui";

const BATCH = 20;
const ORDER = { fail: 0, warning: 1, unavailable: 2, not_checked: 3, pass: 4 };

export default function AuditTab({ data, reload }) {
  const [run, setRun] = useState(null); // { phase, done, total, result, error, saved }
  const [open, setOpen] = useState(null);
  const cancelled = useRef(false);

  const start = async () => {
    cancelled.current = false;
    const startedAt = new Date().toISOString();
    setRun({ phase: "Reading robots.txt and sitemap.xml…", done: 0, total: 0 });
    try {
      const plan = await seoAuditPlan();
      const results = [];
      setRun({ phase: "Checking pages…", done: 0, total: plan.urls.length });
      for (let i = 0; i < plan.urls.length; i += BATCH) {
        if (cancelled.current) { setRun({ phase: "Cancelled", done: results.length, total: plan.urls.length }); return; }
        results.push(...await seoAuditCheck(plan.urls.slice(i, i + BATCH)));
        setRun({ phase: "Checking pages…", done: results.length, total: plan.urls.length });
      }
      setRun({ phase: "Checking internal link targets…", done: results.length, total: plan.urls.length });
      const probe = linkTargetsToProbe(plan, results);
      const linkStatus = new Map();
      for (let i = 0; i < probe.length; i += BATCH * 2) {
        for (const r of await seoAuditStatus(probe.slice(i, i + BATCH * 2))) linkStatus.set(r.url, r.status);
      }
      const result = analyzeAudit({ plan, results, linkStatus });
      result.plan = plan;
      result.probed = probe.length;

      let saved = false;
      if (data.migration.auditRuns) {
        const { data: session } = await supabase.auth.getSession();
        const { error } = await supabase.from("seo_audit_runs").insert({
          started_at: startedAt,
          finished_at: new Date().toISOString(),
          pages_checked: result.pagesChecked,
          summary: result.summary,
          findings: result.findings.slice(0, 3000),
          triggered_by: session.session?.user?.id || null,
        });
        saved = !error;
      }
      setRun({ phase: "Done", done: results.length, total: plan.urls.length, result, saved });
      if (saved) reload();
    } catch (err) {
      setRun({ phase: "Failed", error: err.message, done: 0, total: 0 });
    }
  };

  const loadRun = async (id) => {
    const { data: row, error } = await supabase.from("seo_audit_runs").select("*").eq("id", id).single();
    if (error) { setRun({ phase: "Failed", error: error.message }); return; }
    setRun({ phase: "Done", done: row.pages_checked, total: row.pages_checked, result: { summary: row.summary, findings: row.findings, pagesChecked: row.pages_checked, historical: row.started_at }, saved: true });
  };

  const running = run && !["Done", "Failed", "Cancelled"].includes(run.phase);
  const result = run?.result;
  const checks = result ? Object.entries(result.summary).sort((a, b) => ORDER[a[1].state] - ORDER[b[1].state] || b[1].affected - a[1].affected) : [];

  return (
    <div>
      <Notice>
        Crawls every URL in the live sitemap from the server, as a Googlebot-compatible client — so it checks the HTML search engines actually receive. Only www.trademarco.com is requested, 4 pages at a time with an 8-second timeout. Checks it can&rsquo;t measure are marked <em>Not checked</em> or <em>Data unavailable</em> rather than guessed.
      </Notice>
      {!data.migration.auditRuns && <div style={{ marginTop: 10 }}><MigrationNotice what="Saving audit history" /></div>}

      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: "16px 0", flexWrap: "wrap" }}>
        <button type="button" style={btn.primary} onClick={start} disabled={running}>{running ? "Running…" : "Run technical audit"}</button>
        {running && <button type="button" style={btn.secondary} onClick={() => { cancelled.current = true; }}>Cancel</button>}
        {run && (
          <span role="status" style={{ fontSize: 13, color: ADMIN_COLORS.medGray }}>
            {run.phase}{run.total ? ` ${run.done}/${run.total}` : ""}{run.phase === "Done" && !result?.historical ? (run.saved ? " · saved to history" : data.migration.auditRuns ? " · could not save" : " · not saved (migration needed)") : ""}
          </span>
        )}
      </div>
      {running && run.total > 0 && (
        <div style={{ height: 6, background: ADMIN_COLORS.borderGray, borderRadius: 3, overflow: "hidden", marginBottom: 16 }} aria-hidden="true">
          <div style={{ height: "100%", width: `${(run.done / run.total) * 100}%`, background: ADMIN_COLORS.accent, transition: "width 0.3s" }} />
        </div>
      )}
      {run?.error && <Notice tone="error" title="Audit failed">{run.error}</Notice>}

      {result && (
        <>
          <SectionTitle>{result.historical ? `Audit of ${new Date(result.historical).toLocaleString()}` : "Results"} · {result.pagesChecked} pages</SectionTitle>
          <div style={table.wrap}>
            <table style={table.table}>
              <thead><tr>{["Check", "Result", "Affected", "Detail", ""].map((h) => <th key={h} scope="col" style={table.th}>{h}</th>)}</tr></thead>
              <tbody>
                {checks.map(([id, s]) => {
                  const own = result.findings.filter((f) => f.check === id);
                  return (
                    <Fragment key={id}>
                      <tr>
                        <td style={{ ...table.td, fontWeight: 600 }}>{s.label}</td>
                        <td style={table.td}><StateBadge state={s.state} /></td>
                        <td style={table.td}>{s.affected || "—"}</td>
                        <td style={{ ...table.td, fontSize: 12.5, color: ADMIN_COLORS.medGray, maxWidth: 420 }}>{s.detail || s.impact}</td>
                        <td style={table.td}>{own.length > 0 && <button type="button" style={btn.secondary} aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}>{open === id ? "Hide" : "Review"}</button>}</td>
                      </tr>
                      {open === id && (
                        <tr>
                          <td colSpan={5} style={{ ...table.td, background: ADMIN_COLORS.offWhite }}>
                            <div style={{ fontSize: 12.5, marginBottom: 8 }}><strong>Impact:</strong> {s.impact} <strong>Proposed fix:</strong> {s.fix}</div>
                            <div style={{ maxHeight: 320, overflowY: "auto" }}>
                              {own.slice(0, 300).map((f, i) => (
                                <div key={i} style={{ fontSize: 12.5, padding: "4px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}`, display: "flex", gap: 8 }}>
                                  <StateBadge state={f.level} />
                                  <a href={f.url} target="_blank" rel="noreferrer" style={{ color: ADMIN_COLORS.accent, wordBreak: "break-all" }}>{f.url.replace("https://www.trademarco.com", "") || "/"}</a>
                                  <span style={{ color: ADMIN_COLORS.medGray }}>{f.detail}</span>
                                </div>
                              ))}
                              {own.length > 300 && <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>…and {own.length - 300} more.</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!result.historical && (
            <p style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginTop: 8, lineHeight: 1.5 }}>
              {result.probed} linked URLs outside the sitemap were status-checked. Catalogue URLs return a real 404 when missing; other paths are served by the single-page app, which answers 200 for any path, so a broken non-catalogue link can only be confirmed by opening it.
            </p>
          )}
        </>
      )}

      <SectionTitle>Audit history</SectionTitle>
      {!data.migration.auditRuns ? <Empty>History is stored once the migration is applied.</Empty> : data.auditRuns.length === 0 ? <Empty>No saved audits yet.</Empty> : (
        <div style={{ ...card, padding: 0 }}>
          {data.auditRuns.map((r) => {
            const s = Object.values(r.summary || {});
            return (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "10px 16px", borderBottom: `1px solid ${ADMIN_COLORS.borderGray}`, fontSize: 13, flexWrap: "wrap" }}>
                <span>{new Date(r.started_at).toLocaleString()} · {r.pages_checked} pages</span>
                <span style={{ color: ADMIN_COLORS.medGray }}>{s.filter((x) => x.state === "fail").length} failing checks · {s.filter((x) => x.state === "warning").length} warnings</span>
                <button type="button" style={btn.secondary} onClick={() => loadRun(r.id)}>Open</button>
              </div>
            );
          })}
        </div>
      )}
      <p style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginTop: 12 }}>Checks performed: {Object.values(TECH_CHECKS).map((c) => c.label).join(" · ")}.</p>
    </div>
  );
}

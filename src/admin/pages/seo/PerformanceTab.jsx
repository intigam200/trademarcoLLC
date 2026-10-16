import { useEffect, useMemo, useState } from "react";
import { ADMIN_COLORS } from "../../theme";
import { gscStatus, gscQuery } from "../../lib/adminApi";
import { totals, findOpportunities } from "../../../lib/seoAudit/gscOpportunities";
import { gscRange } from "./gscDates";
import GscSetup from "./GscSetup";
import { Kpi, KpiGrid, SectionTitle, Loading, Notice, Empty, Pager, table, inputStyle, btn } from "./ui";

const TYPE_LABEL = { low_ctr: "Low CTR for its position", no_clicks: "Page one, no clicks", striking_distance: "Ranking on page two", declining: "Declining clicks" };
const PAGE_SIZE = 25;

function delta(curr, prev, { invert = false, fmt = (v) => v.toLocaleString() } = {}) {
  if (prev === undefined || prev === null) return null;
  const diff = curr - prev;
  if (!diff) return <span style={{ color: ADMIN_COLORS.medGray }}>no change</span>;
  const good = invert ? diff < 0 : diff > 0;
  return <span style={{ color: good ? ADMIN_COLORS.success : ADMIN_COLORS.danger }}>{diff > 0 ? "+" : ""}{fmt(diff)} vs previous period</span>;
}

export default function PerformanceTab() {
  const [status, setStatus] = useState(null);
  const [days, setDays] = useState(28);
  const [dimension, setDimension] = useState("query");
  const [pageFilter, setPageFilter] = useState("");
  const [state, setState] = useState({ loading: false, error: "", current: [], previous: [], totalsNow: null, totalsPrev: null });
  const [page, setPage] = useState(1);

  useEffect(() => { gscStatus().then(setStatus).catch((err) => setStatus({ connected: false, error: err.message })); }, []);

  useEffect(() => {
    if (!status?.connected) return;
    let cancelled = false;
    const now = gscRange(days, 0);
    const prev = gscRange(days, 1);
    setState((s) => ({ ...s, loading: true, error: "" }));
    Promise.all([
      gscQuery({ ...now, dimension }), gscQuery({ ...prev, dimension }),
      gscQuery({ ...now, dimension: "none" }), gscQuery({ ...prev, dimension: "none" }),
    ])
      .then(([current, previous, aNow, aPrev]) => { if (!cancelled) setState({ loading: false, error: "", current, previous, totalsNow: totals(aNow), totalsPrev: totals(aPrev), range: now }); })
      .catch((err) => { if (!cancelled) setState((s) => ({ ...s, loading: false, error: err.message })); });
    setPage(1);
    return () => { cancelled = true; };
  }, [status, days, dimension]);

  const { current, previous } = state;
  const prevMap = useMemo(() => new Map(previous.map((r) => [r.keys[0], r])), [previous]);
  const rows = useMemo(() => current.filter((r) => {
    if (dimension !== "page" || !pageFilter) return true;
    if (pageFilter === "product") return /\/manufacturers\/[^/]+\/[^/?#]+/.test(r.keys[0]);
    if (pageFilter === "brand") return /\/manufacturers\/[^/?#]+\/?$/.test(r.keys[0]);
    if (pageFilter === "category") return /[?&]category=/.test(r.keys[0]);
    if (pageFilter === "article") return /\/articles\//.test(r.keys[0]);
    return true;
  }), [current, dimension, pageFilter]);
  const opportunities = useMemo(() => findOpportunities(rows, { previousRows: previous }), [rows, previous]);

  if (!status) return <Loading label="Checking Search Console connection…" />;
  if (!status.connected) return <GscSetup status={status} />;

  const t = state.totalsNow;
  const p = state.totalsPrev;
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center" }}>
        <select aria-label="Date range" style={{ ...inputStyle, width: "auto" }} value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>Last 7 days</option><option value={28}>Last 28 days</option><option value={90}>Last 90 days</option>
        </select>
        {["query", "page"].map((d) => (
          <button key={d} type="button" onClick={() => setDimension(d)} aria-pressed={dimension === d} style={{ ...btn.secondary, ...(dimension === d ? { borderColor: ADMIN_COLORS.accent, color: ADMIN_COLORS.accent } : {}) }}>{d === "query" ? "Queries" : "Landing pages"}</button>
        ))}
        {dimension === "page" && (
          <select aria-label="Page type" style={{ ...inputStyle, width: "auto" }} value={pageFilter} onChange={(e) => { setPageFilter(e.target.value); setPage(1); }}>
            <option value="">All pages</option><option value="product">Product pages</option><option value="brand">Brand pages</option><option value="category">Category pages</option><option value="article">Articles</option>
          </select>
        )}
        {state.range && <span style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>{state.range.startDate} – {state.range.endDate} (Search Console data lags ~3 days)</span>}
      </div>

      {state.error && <Notice tone="error" title="Search Console request failed">{state.error}</Notice>}
      {state.loading && !t ? <Loading label="Loading Search Console data…" /> : t && (
        <>
          <KpiGrid>
            <Kpi label="Impressions" value={t.impressions.toLocaleString()} note={delta(t.impressions, p?.impressions)} />
            <Kpi label="Clicks" value={t.clicks.toLocaleString()} note={delta(t.clicks, p?.clicks)} />
            <Kpi label="CTR" value={`${(t.ctr * 100).toFixed(2)}%`} note={delta(t.ctr * 100, p ? p.ctr * 100 : null, { fmt: (v) => `${v.toFixed(2)} pts` })} />
            <Kpi label="Average position" value={t.position ? t.position.toFixed(1) : "—"} note={delta(t.position, p?.position, { invert: true, fmt: (v) => v.toFixed(1) })} />
          </KpiGrid>

          <SectionTitle>Search opportunities</SectionTitle>
          <p style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray, margin: "-4px 0 10px" }}>Calculated only from this site&rsquo;s Search Console data for the selected period; no search volumes or competitor positions are estimated.</p>
          {opportunities.length === 0 ? <Empty>No opportunities met the thresholds (at least 50 impressions) in this period.</Empty> : (
            <div style={table.wrap}>
              <table style={table.table}>
                <thead><tr>{["Type", dimension === "query" ? "Query" : "Page", "Clicks", "Impr.", "CTR", "Pos.", "Why", "Suggested action"].map((h) => <th key={h} scope="col" style={table.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {opportunities.slice(0, 40).map((o, i) => (
                    <tr key={`${o.type}-${o.key}-${i}`}>
                      <td style={{ ...table.td, whiteSpace: "nowrap" }}>{TYPE_LABEL[o.type]}</td>
                      <td style={{ ...table.td, wordBreak: "break-all", minWidth: 180 }}>{o.key.replace("https://www.trademarco.com", "")}</td>
                      <td style={table.td}>{o.row.clicks}</td><td style={table.td}>{o.row.impressions}</td>
                      <td style={table.td}>{(o.row.ctr * 100).toFixed(1)}%</td><td style={table.td}>{o.row.position.toFixed(1)}</td>
                      <td style={{ ...table.td, fontSize: 12.5, color: ADMIN_COLORS.medGray }}>{o.detail}</td>
                      <td style={{ ...table.td, fontSize: 12.5 }}>{o.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <SectionTitle>{dimension === "query" ? "Queries" : "Landing pages"}</SectionTitle>
          {rows.length === 0 ? <Empty>No rows for this selection.</Empty> : (
            <>
              <div style={table.wrap}>
                <table style={table.table}>
                  <thead><tr>{[dimension === "query" ? "Query" : "Page", "Clicks", "Δ clicks", "Impressions", "CTR", "Position"].map((h) => <th key={h} scope="col" style={table.th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {visible.map((r) => {
                      const prev = prevMap.get(r.keys[0]);
                      const d = prev ? r.clicks - prev.clicks : null;
                      return (
                        <tr key={r.keys[0]}>
                          <td style={{ ...table.td, wordBreak: "break-all" }}>{r.keys[0].replace("https://www.trademarco.com", "")}</td>
                          <td style={table.td}>{r.clicks}</td>
                          <td style={{ ...table.td, color: d > 0 ? ADMIN_COLORS.success : d < 0 ? ADMIN_COLORS.danger : ADMIN_COLORS.medGray }}>{d === null ? "new" : d > 0 ? `+${d}` : d}</td>
                          <td style={table.td}>{r.impressions}</td>
                          <td style={table.td}>{(r.ctr * 100).toFixed(1)}%</td>
                          <td style={table.td}>{r.position.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pager page={page} pageCount={pageCount} onPage={setPage} total={rows.length} label="rows" />
            </>
          )}
          <p style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>Search Console reports search behaviour only. It doesn&rsquo;t say which visits sent an RFQ — see “RFQs from search visits” on the Overview, which uses each RFQ&rsquo;s first-touch referrer.</p>
        </>
      )}
    </div>
  );
}

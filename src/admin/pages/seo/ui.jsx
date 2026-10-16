import { ADMIN_COLORS } from "../../theme";
import Icon from "../../../components/Icon";
import { MIGRATION_FILE } from "../../../lib/supabase/schemaStatus";

// Small presentational pieces shared across the SEO Growth Center tabs, in the
// admin's existing visual language (AdminCard spacing, StatusBadge pills).

export const card = { background: ADMIN_COLORS.cardBg, border: `1px solid ${ADMIN_COLORS.borderGray}`, borderRadius: 10, padding: 20 };

const SEVERITY = {
  high: { bg: ADMIN_COLORS.dangerBg, color: ADMIN_COLORS.danger, label: "High" },
  medium: { bg: ADMIN_COLORS.warningBg, color: ADMIN_COLORS.warning, label: "Medium" },
  low: { bg: ADMIN_COLORS.neutralBg, color: ADMIN_COLORS.neutral, label: "Low" },
};

const STATE = {
  pass: { bg: ADMIN_COLORS.successBg, color: ADMIN_COLORS.success, label: "Pass", icon: "check" },
  warning: { bg: ADMIN_COLORS.warningBg, color: ADMIN_COLORS.warning, label: "Warning", icon: "alert-triangle" },
  fail: { bg: ADMIN_COLORS.dangerBg, color: ADMIN_COLORS.danger, label: "Fail", icon: "x-circle" },
  not_checked: { bg: ADMIN_COLORS.neutralBg, color: ADMIN_COLORS.neutral, label: "Not checked", icon: "info" },
  unavailable: { bg: ADMIN_COLORS.neutralBg, color: ADMIN_COLORS.neutral, label: "Data unavailable", icon: "lock" },
};

function Pill({ bg, color, children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: bg, color, whiteSpace: "nowrap" }}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }) {
  if (!severity) return <Pill bg={ADMIN_COLORS.successBg} color={ADMIN_COLORS.success}>OK</Pill>;
  const s = SEVERITY[severity];
  return <Pill bg={s.bg} color={s.color}>{s.label}</Pill>;
}

export function StateBadge({ state }) {
  const s = STATE[state] || STATE.not_checked;
  return <Pill bg={s.bg} color={s.color}><Icon type={s.icon} size={12} color={s.color} />{s.label}</Pill>;
}

export function Kpi({ label, value, note, tone }) {
  const color = tone === "bad" ? ADMIN_COLORS.danger : tone === "warn" ? ADMIN_COLORS.warning : ADMIN_COLORS.navy;
  return (
    <div style={{ ...card, padding: 16, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {note && <div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray, marginTop: 6, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

export function KpiGrid({ children }) {
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 12 }}>{children}</div>;
}

export function Notice({ tone = "info", title, children }) {
  const palette = tone === "warn" ? [ADMIN_COLORS.warningBg, ADMIN_COLORS.warning] : tone === "error" ? [ADMIN_COLORS.dangerBg, ADMIN_COLORS.danger] : [ADMIN_COLORS.iconBlueBg, ADMIN_COLORS.iconBlue];
  return (
    <div role={tone === "error" ? "alert" : undefined} style={{ background: palette[0], borderLeft: `3px solid ${palette[1]}`, borderRadius: 6, padding: "12px 14px", fontSize: 13, color: ADMIN_COLORS.navy, lineHeight: 1.55 }}>
      {title && <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>}
      {children}
    </div>
  );
}

export function MigrationNotice({ what }) {
  return (
    <Notice tone="warn" title="Database migration needed">
      {what} needs the SEO Growth Center tables. Open Supabase → SQL Editor, paste the contents of <code>{MIGRATION_FILE}</code> and run it once. It only adds tables and columns; nothing existing is changed.
    </Notice>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "28px 0 12px", flexWrap: "wrap" }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>{children}</h2>
      {action}
    </div>
  );
}

export function Empty({ children }) {
  return <div style={{ ...card, textAlign: "center", color: ADMIN_COLORS.medGray, fontSize: 13, padding: "32px 20px" }}>{children}</div>;
}

export function Loading({ label = "Loading…" }) {
  return <div role="status" style={{ fontSize: 13, color: ADMIN_COLORS.medGray, padding: "40px 0", textAlign: "center" }}>{label}</div>;
}

export const btn = {
  base: { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, borderRadius: 6, cursor: "pointer", border: "1px solid transparent", whiteSpace: "nowrap" },
  get primary() { return { ...this.base, background: ADMIN_COLORS.accent, color: ADMIN_COLORS.white }; },
  get secondary() { return { ...this.base, background: ADMIN_COLORS.white, color: ADMIN_COLORS.navy, borderColor: ADMIN_COLORS.borderGray }; },
  get danger() { return { ...this.base, background: ADMIN_COLORS.white, color: ADMIN_COLORS.danger, borderColor: ADMIN_COLORS.borderGray }; },
  get link() { return { ...this.base, padding: 0, background: "none", color: ADMIN_COLORS.accent }; },
};

export const table = {
  wrap: { ...card, padding: 0, overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", padding: "10px 12px", fontSize: 11.5, fontWeight: 700, color: ADMIN_COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: `1px solid ${ADMIN_COLORS.borderGray}`, background: ADMIN_COLORS.offWhite, whiteSpace: "nowrap" },
  td: { padding: "10px 12px", borderBottom: `1px solid ${ADMIN_COLORS.borderGray}`, verticalAlign: "top", color: ADMIN_COLORS.darkGray },
};

export function Pager({ page, pageCount, onPage, total, label = "items" }) {
  if (pageCount <= 1) return <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray, padding: "10px 0" }}>{total} {label}</div>;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", fontSize: 12, color: ADMIN_COLORS.medGray, flexWrap: "wrap" }}>
      <span>{total} {label} · page {page} of {pageCount}</span>
      <div style={{ display: "flex", gap: 6 }}>
        <button type="button" style={btn.secondary} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><Icon type="chevron-left" size={14} /></button>
        <button type="button" style={btn.secondary} disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page"><Icon type="chevron-right" size={14} /></button>
      </div>
    </div>
  );
}

export const inputStyle = { width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${ADMIN_COLORS.borderGray}`, borderRadius: 6, background: ADMIN_COLORS.white, color: ADMIN_COLORS.navy, boxSizing: "border-box", fontFamily: "inherit" };

export function Field({ label, hint, counter, children }) {
  return (
    <label style={{ display: "block", fontSize: 12.5, color: ADMIN_COLORS.navy }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: 8, fontWeight: 600, marginBottom: 5 }}>
        <span>{label}</span>
        {counter}
      </span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 11.5, color: ADMIN_COLORS.medGray, marginTop: 4, lineHeight: 1.45 }}>{hint}</span>}
    </label>
  );
}

export function LengthCounter({ value, min, max }) {
  const n = (value || "").length;
  const ok = n >= (min ?? 0) && n <= max;
  return <span style={{ fontWeight: 500, color: ok ? ADMIN_COLORS.medGray : ADMIN_COLORS.warning }}>{n}{min ? ` / ${min}–${max}` : ` / ${max}`}</span>;
}

// Approximation of a Google result. Google truncates by pixel width, so this
// trims at a typical character count and says so.
export function SerpPreview({ title, description, url }) {
  const t = title.length > 60 ? `${title.slice(0, 59)}…` : title;
  const d = description.length > 160 ? `${description.slice(0, 159)}…` : description;
  return (
    <div style={{ ...card, padding: 16, fontFamily: "Arial, sans-serif" }}>
      <div style={{ fontSize: 12, color: "#202124", marginBottom: 2 }}>trademarco.com <span style={{ color: "#4d5156" }}>› {url.replace(/^https?:\/\/[^/]+\/?/, "").split("/").filter(Boolean).join(" › ")}</span></div>
      <div style={{ fontSize: 19, color: "#1a0dab", lineHeight: 1.3, marginBottom: 3 }}>{t || "(no title)"}</div>
      <div style={{ fontSize: 13.5, color: "#4d5156", lineHeight: 1.55 }}>{d || "(no description — Google will pick text from the page)"}</div>
      <div style={{ fontSize: 11, color: ADMIN_COLORS.medGray, marginTop: 10, fontFamily: "inherit" }}>Approximate preview. Google truncates by pixel width and may rewrite titles and descriptions.</div>
    </div>
  );
}

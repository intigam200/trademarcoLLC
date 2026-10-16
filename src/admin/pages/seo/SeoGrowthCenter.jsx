import { useEffect } from "react";
import { NavLink, Navigate, useParams } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { ADMIN_COLORS } from "../../theme";
import { useSeoData } from "./useSeoData";
import { Loading, Notice, btn } from "./ui";
import Icon from "../../../components/Icon";
import OverviewTab from "./OverviewTab";
import ProductSeoTab from "./ProductSeoTab";
import PagesSeoTab from "./PagesSeoTab";
import ContentTab from "./ContentTab";
import AuditTab from "./AuditTab";
import PerformanceTab from "./PerformanceTab";
import SettingsTab from "./SettingsTab";

const TABS = [
  { id: "overview", label: "Overview", Component: OverviewTab },
  { id: "products", label: "Product SEO", Component: ProductSeoTab },
  { id: "pages", label: "Category & Brand SEO", Component: PagesSeoTab },
  { id: "content", label: "Content Studio", Component: ContentTab },
  { id: "audit", label: "Technical Audit", Component: AuditTab },
  { id: "performance", label: "Search Performance", Component: PerformanceTab },
  { id: "settings", label: "Settings & Integrations", Component: SettingsTab },
];

export default function SeoGrowthCenter() {
  const { section = "overview" } = useParams();
  const tab = TABS.find((t) => t.id === section);
  const { loading, error, data, reload } = useSeoData();

  useEffect(() => { document.title = `SEO Growth Center${tab ? ` — ${tab.label}` : ""} | Trademarco Global Admin`; }, [tab]);

  if (!tab) return <Navigate to="/admin/seo" replace />;
  const { Component } = tab;

  return (
    <div>
      <PageHeader
        title="SEO Growth Center"
        description="Search visibility for the live catalogue: what the site serves today, what to fix first, and — once connected — how it performs in Google."
        actions={
          <button type="button" style={btn.secondary} onClick={reload} disabled={loading}>
            <Icon type="download" size={14} /> {loading ? "Loading…" : "Reload data"}
          </button>
        }
      />

      <nav aria-label="SEO Growth Center sections" style={{ display: "flex", gap: 4, overflowX: "auto", borderBottom: `1px solid ${ADMIN_COLORS.borderGray}`, marginBottom: 20 }}>
        {TABS.map((t) => (
          <NavLink
            key={t.id}
            to={t.id === "overview" ? "/admin/seo" : `/admin/seo/${t.id}`}
            end
            style={({ isActive }) => ({
              padding: "10px 14px", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", textDecoration: "none",
              color: isActive || (t.id === "overview" && section === "overview") ? ADMIN_COLORS.accent : ADMIN_COLORS.medGray,
              borderBottom: `2px solid ${isActive || (t.id === "overview" && section === "overview") ? ADMIN_COLORS.accent : "transparent"}`,
              marginBottom: -1,
            })}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      {error ? (
        <Notice tone="error" title="Could not load catalogue data">{error}</Notice>
      ) : loading && !data ? (
        <Loading label="Loading catalogue, articles and audit history…" />
      ) : (
        <Component data={data} reload={reload} />
      )}
    </div>
  );
}

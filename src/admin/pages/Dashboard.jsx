import { useEffect } from "react";
import { MANUFACTURERS, PRODUCTS as CATEGORIES } from "../../data/content";
import { MOCK_RFQS, MOCK_RECENT_ACTIVITY, MOCK_RECENT_IMPORTS, SYSTEM_STATUS } from "../data/mock";
import { ADMIN_COLORS } from "../theme";
import AdminCard from "../components/AdminCard";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

const STATUS_DOT = {
  operational: ADMIN_COLORS.success,
  configured: ADMIN_COLORS.iconBlue,
  empty: ADMIN_COLORS.warning,
  not_connected: ADMIN_COLORS.medGray,
};
const STATUS_LABEL = {
  operational: "Operational",
  configured: "Configured",
  empty: "Empty",
  not_connected: "Not Connected",
};

function EmptyState({ text }) {
  return <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: 0, textAlign: "center", padding: "20px 0" }}>{text}</p>;
}

export default function Dashboard() {
  useEffect(() => { document.title = "Dashboard | TradeMarco Admin"; }, []);

  // Products/Manufacturers/Categories reflect real app data (the live catalog
  // is intentionally empty in Phase 1). Pending RFQs is sample data — there's
  // no RFQ backend yet.
  const pendingRFQs = MOCK_RFQS.filter((r) => r.status !== "closed").length;

  const kpis = [
    { label: "Products", value: 0, icon: "box", note: "Catalog not yet populated" },
    { label: "Manufacturers", value: MANUFACTURERS.length, icon: "factory" },
    { label: "Categories", value: CATEGORIES.length, icon: "clipboard" },
    { label: "Pending RFQs", value: pendingRFQs, icon: "mail", note: "Sample data" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of the TradeMarco catalog and RFQ pipeline." />

      <div className="tm-admin-kpi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 24 }}>
        {kpis.map((k) => (
          <AdminCard key={k.label} style={{ padding: 22 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  {k.label}
                </div>
                <div style={{ fontSize: 30, fontWeight: 800, color: ADMIN_COLORS.navy, lineHeight: 1 }}>{k.value}</div>
                {k.note && <div style={{ fontSize: 11, color: ADMIN_COLORS.medGray, marginTop: 6 }}>{k.note}</div>}
              </div>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: ADMIN_COLORS.iconBlueBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon type={k.icon} size={18} color={ADMIN_COLORS.iconBlue} />
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <div className="tm-admin-panel-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <AdminCard title="Recent Activity">
          {MOCK_RECENT_ACTIVITY.length === 0 ? (
            <EmptyState text="No recent activity." />
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
              {MOCK_RECENT_ACTIVITY.map((a) => (
                <li key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13, color: ADMIN_COLORS.darkGray }}>
                  <span>{a.action}</span>
                  <span style={{ color: ADMIN_COLORS.medGray, whiteSpace: "nowrap" }}>{a.time}</span>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AdminCard title="Recent Imports">
            {MOCK_RECENT_IMPORTS.length === 0 ? (
              <EmptyState text="No imports yet — run one from the Import page." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
                {MOCK_RECENT_IMPORTS.map((imp) => (
                  <li key={imp.id} style={{ fontSize: 13, color: ADMIN_COLORS.darkGray }}>{imp.file}</li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="System Status">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {SYSTEM_STATUS.map((s) => (
                <li key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, gap: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, color: ADMIN_COLORS.darkGray }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_DOT[s.status], flexShrink: 0 }} />
                    {s.label}
                  </span>
                  <span style={{ color: ADMIN_COLORS.medGray, fontSize: 12, textAlign: "right" }}>
                    {STATUS_LABEL[s.status]}{s.note ? ` · ${s.note}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>
      </div>

      <style>{`
        @media (max-width: 1100px) {
          .tm-admin-kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .tm-admin-panel-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .tm-admin-kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

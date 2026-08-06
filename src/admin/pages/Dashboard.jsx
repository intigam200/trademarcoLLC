import { useEffect, useState } from "react";
import { countManufacturers } from "../../lib/supabase/manufacturers";
import { countCategories } from "../../lib/supabase/categories";
import { countProducts, listProducts } from "../../lib/supabase/products";
import { countRFQs } from "../../lib/supabase/rfqs";
import { MOCK_RECENT_ACTIVITY } from "../data/mock";
import { ADMIN_COLORS } from "../theme";
import AdminCard from "../components/AdminCard";
import PageHeader from "../components/PageHeader";
import Icon from "../../components/Icon";

const STATUS_DOT = {
  operational: ADMIN_COLORS.success,
  configured: ADMIN_COLORS.iconBlue,
  empty: ADMIN_COLORS.warning,
  error: ADMIN_COLORS.danger,
};
const STATUS_LABEL = {
  operational: "Operational",
  configured: "Configured",
  empty: "Empty",
  error: "Error",
};

function EmptyState({ text }) {
  return <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: 0, textAlign: "center", padding: "20px 0" }}>{text}</p>;
}

export default function Dashboard() {
  useEffect(() => { document.title = "Dashboard | Trademarco Global Admin"; }, []);

  const [counts, setCounts] = useState(null);
  const [countsError, setCountsError] = useState("");
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    Promise.all([
      countProducts({ status: "published" }),
      countManufacturers(),
      countCategories(),
      countRFQs({ status: "unread" }),
    ])
      .then(([products, manufacturers, categories, pendingRfqs]) => {
        setCounts({ products, manufacturers, categories, pendingRfqs });
      })
      .catch((err) => setCountsError(err.message));

    listProducts().then((data) => setRecentProducts(data.slice(0, 5))).catch(() => {});
  }, []);

  const kpis = [
    { label: "Products", value: counts?.products ?? "—", icon: "box", note: "Published only" },
    { label: "Manufacturers", value: counts?.manufacturers ?? "—", icon: "factory" },
    { label: "Categories", value: counts?.categories ?? "—", icon: "clipboard" },
    { label: "Pending RFQs", value: counts?.pendingRfqs ?? "—", icon: "mail" },
  ];

  const systemStatus = [
    { label: "Website", status: "operational" },
    { label: "RFQ Email (SMTP)", status: "configured" },
    { label: "Supabase Database", status: countsError ? "error" : counts ? "operational" : "configured", note: countsError || undefined },
    { label: "Product Catalog", status: counts?.products ? "operational" : "empty", note: counts ? `${counts.products} published` : undefined },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of the Trademarco Global catalog and RFQ pipeline — live from Supabase." />

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
            {recentProducts.length === 0 ? (
              <EmptyState text="No products yet — run an import from the Import page or add one manually." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {recentProducts.map((p) => (
                  <li key={p.id} style={{ fontSize: 13, color: ADMIN_COLORS.darkGray, display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <span>{p.product_name}</span>
                    <span style={{ color: ADMIN_COLORS.medGray, fontSize: 12, whiteSpace: "nowrap" }}>{new Date(p.updated_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="System Status">
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {systemStatus.map((s) => (
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

import { useEffect, useState } from "react";
import { COMPANY_INFO } from "../../data/content";
import { useAdminAuth } from "../context/AdminAuthContext";
import { ADMIN_COLORS } from "../theme";
import PageHeader from "../components/PageHeader";
import AdminCard from "../components/AdminCard";
import { inputStyle } from "../components/FormField";
import Icon from "../../components/Icon";

const TABS = [
  { key: "company", label: "Company Information", icon: "factory" },
  { key: "smtp", label: "SMTP", icon: "mail" },
  { key: "seo", label: "SEO", icon: "search" },
  { key: "users", label: "Users", icon: "user" },
  { key: "security", label: "Security", icon: "shield-check" },
];

function ComingSoonNote({ children }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 12, color: ADMIN_COLORS.medGray, background: ADMIN_COLORS.contentBg, padding: "10px 12px", borderRadius: 6, marginTop: 16 }}>
      <Icon type="info" size={14} color={ADMIN_COLORS.medGray} />
      <span>{children}</span>
    </div>
  );
}

function CompanyPanel() {
  return (
    <AdminCard title="Company Information">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {COMPANY_INFO.map((f) => (
          <div key={f.label}>
            <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>{f.label}</label>
            <input style={inputStyle} value={f.value} disabled />
          </div>
        ))}
      </div>
      <ComingSoonNote>
        Read-only mirror of the data on the public /company page. Editing here (and pushing changes live) is planned for a later phase.
      </ComingSoonNote>
    </AdminCard>
  );
}

function SmtpPanel() {
  const fields = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_FROM"];
  return (
    <AdminCard title="SMTP">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {fields.map((key) => (
          <div key={key}>
            <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>{key}</label>
            <input style={inputStyle} value="Configured via environment variable" disabled />
          </div>
        ))}
      </div>
      <ComingSoonNote>
        RFQ delivery already runs on real SMTP credentials, set as environment variables (see .env.example) — never edited or
        displayed here for security. An in-panel editor for these is planned for a later phase.
      </ComingSoonNote>
    </AdminCard>
  );
}

function SeoPanel() {
  return (
    <AdminCard title="SEO">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>Default Site Title</label>
          <input style={inputStyle} value="TradeMarco — Industrial Sourcing & Procurement" disabled />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>Default Meta Description</label>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} disabled defaultValue="TradeMarco LLC connects buyers with qualified industrial equipment manufacturers worldwide." />
        </div>
      </div>
      <ComingSoonNote>
        Per-product SEO title/description are already set from the Add Product editor and the CSV import. Global/site-wide SEO
        defaults become editable here in a later phase.
      </ComingSoonNote>
    </AdminCard>
  );
}

function UsersPanel() {
  const { email } = useAdminAuth();
  return (
    <AdminCard title="Users">
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 8 }}>
        <span style={{ width: 36, height: 36, borderRadius: "50%", background: ADMIN_COLORS.iconBlueBg, color: ADMIN_COLORS.iconBlue, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
          {(email || "A").charAt(0).toUpperCase()}
        </span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: ADMIN_COLORS.navy }}>{email}</div>
          <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>Administrator</div>
        </div>
      </div>
      <ComingSoonNote>
        Phase 1 supports a single admin identity, configured via environment variables — no registration or sign-up.
        Multiple staff accounts with roles/permissions are planned for a later phase.
      </ComingSoonNote>
    </AdminCard>
  );
}

function SecurityPanel() {
  const rows = [
    { label: "Authentication", value: "Email + password, bcrypt-hashed, server-verified" },
    { label: "Session", value: "Signed JWT in an httpOnly, SameSite=Strict cookie (8-hour expiry)" },
    { label: "Public sign-up", value: "Disabled — no registration route exists" },
    { label: "Password reset", value: "Disabled — rotate ADMIN_PASSWORD_HASH via environment variables" },
  ];
  return (
    <AdminCard title="Security">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map((r) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 13, padding: "10px 0", borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
            <span style={{ color: ADMIN_COLORS.medGray, flexShrink: 0 }}>{r.label}</span>
            <span style={{ color: ADMIN_COLORS.darkGray, textAlign: "right" }}>{r.value}</span>
          </div>
        ))}
      </div>
      <ComingSoonNote>
        Two-factor authentication and an audit log of admin actions are planned for a later phase.
      </ComingSoonNote>
    </AdminCard>
  );
}

const PANELS = { company: CompanyPanel, smtp: SmtpPanel, seo: SeoPanel, users: UsersPanel, security: SecurityPanel };

export default function AdminSettings() {
  useEffect(() => { document.title = "Settings | TradeMarco Admin"; }, []);
  const [tab, setTab] = useState("company");
  const ActivePanel = PANELS[tab];

  return (
    <div>
      <PageHeader title="Settings" description="Configuration for the admin platform. Most sections are read-only placeholders in Phase 1." />

      <div className="tm-settings-layout" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, alignItems: "start" }}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 6, border: "none",
                background: tab === t.key ? ADMIN_COLORS.iconBlueBg : "transparent",
                color: tab === t.key ? ADMIN_COLORS.iconBlue : ADMIN_COLORS.darkGray,
                fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left",
              }}
            >
              <Icon type={t.icon} size={16} color={tab === t.key ? ADMIN_COLORS.iconBlue : ADMIN_COLORS.medGray} />
              {t.label}
            </button>
          ))}
        </nav>

        <ActivePanel />
      </div>

      <style>{`
        @media (max-width: 800px) {
          .tm-settings-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

import { ADMIN_COLORS } from "../theme";

export default function PageHeader({ title, description, actions }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: ADMIN_COLORS.navy, margin: "0 0 4px" }}>{title}</h1>
        {description && <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: 0, maxWidth: 560 }}>{description}</p>}
      </div>
      {actions && <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
    </div>
  );
}

import { ADMIN_COLORS } from "../theme";

export default function AdminCard({ title, action, children, style = {} }) {
  return (
    <div style={{ background: ADMIN_COLORS.cardBg, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 10, padding: 20, ...style }}>
      {title && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

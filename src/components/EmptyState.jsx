import { COLORS } from "../theme/colors";
import Icon from "./Icon";

export default function EmptyState({ icon = "info", title, description, action, minHeight = 240 }) {
  return (
    <div style={{ minHeight, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", textAlign: "center" }}>
      <Icon type={icon} size={30} color={COLORS.borderGray} />
      {title && <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "16px 0 6px" }}>{title}</h3>}
      {description && <p style={{ fontSize: 14, color: COLORS.medGray, margin: 0, maxWidth: 420, lineHeight: 1.6 }}>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}

import { COLORS } from "../theme/colors";

export default function Button({ children, variant = "primary", style = {}, as: As = "button", ...props }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 8,
    padding: "14px 32px", fontSize: 15, fontWeight: 600, fontFamily: "inherit",
    borderRadius: 3, cursor: "pointer", transition: "all 0.15s ease",
    textDecoration: "none", letterSpacing: "0.02em", border: "none",
  };
  const variants = {
    primary: { background: COLORS.orange, color: COLORS.white },
    secondary: { background: "transparent", color: COLORS.white, border: `1.5px solid rgba(255,255,255,0.4)` },
    outline: { background: "transparent", color: COLORS.navy, border: `1.5px solid ${COLORS.borderGray}` },
    dark: { background: COLORS.navy, color: COLORS.white },
  };
  return <As className={`tm-btn tm-btn-${variant}`} style={{ ...base, ...variants[variant], ...style }} {...props}>{children}</As>;
}

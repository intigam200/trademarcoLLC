import { ADMIN_COLORS } from "../theme";

export function FormField({ label, hint, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy, display: "block", marginBottom: 6 }}>
        {label} {required && <span style={{ color: ADMIN_COLORS.danger }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: ADMIN_COLORS.medGray, marginTop: 5, lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

export const inputStyle = {
  width: "100%", padding: "10px 12px", fontSize: 13, fontFamily: "inherit",
  border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, outline: "none",
  color: ADMIN_COLORS.darkGray, background: ADMIN_COLORS.white,
};

import { ADMIN_COLORS } from "../theme";
import Icon from "../../components/Icon";

export default function Modal({ title, onClose, children, footer }) {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: ADMIN_COLORS.white, borderRadius: 10, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: ADMIN_COLORS.navy, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }} aria-label="Close">
            <Icon type="close" size={18} color={ADMIN_COLORS.medGray} />
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
        {footer && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, padding: "16px 22px", borderTop: `1px solid ${ADMIN_COLORS.border}` }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

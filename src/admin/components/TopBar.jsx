import { useState, useRef, useEffect } from "react";
import { ADMIN_COLORS } from "../theme";
import { useAdminAuth } from "../context/AdminAuthContext";
import Icon from "../../components/Icon";

export default function TopBar({ onMenuClick }) {
  const { email, logout } = useAdminAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!profileOpen) return;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [profileOpen]);

  const initial = (email || "A").charAt(0).toUpperCase();

  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      background: ADMIN_COLORS.cardBg, borderBottom: `1px solid ${ADMIN_COLORS.border}`,
      padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
        <button
          onClick={onMenuClick}
          className="tm-admin-menu-btn"
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "none", flexShrink: 0 }}
          aria-label="Open menu"
        >
          <Icon type="menu" size={22} color={ADMIN_COLORS.navy} />
        </button>

        <div style={{ position: "relative", maxWidth: 360, width: "100%" }}>
          <Icon type="search" size={16} color={ADMIN_COLORS.medGray} className="tm-admin-search-icon" />
          <input
            type="text"
            placeholder="Search products, manufacturers, RFQs&hellip;"
            style={{
              width: "100%", padding: "9px 12px 9px 36px", fontSize: 13, fontFamily: "inherit",
              border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, outline: "none",
              background: ADMIN_COLORS.contentBg, color: ADMIN_COLORS.darkGray,
            }}
          />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 18, flexShrink: 0 }}>
        <button
          title="Notifications (placeholder)"
          style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6 }}
        >
          <Icon type="bell" size={19} color={ADMIN_COLORS.medGray} />
          <span style={{
            position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%",
            background: ADMIN_COLORS.accent, border: `1.5px solid ${ADMIN_COLORS.cardBg}`,
          }} />
        </button>

        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            style={{
              display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer",
              padding: "4px 6px 4px 4px", borderRadius: 20,
            }}
          >
            <span style={{
              width: 32, height: 32, borderRadius: "50%", background: ADMIN_COLORS.iconBlueBg, color: ADMIN_COLORS.iconBlue,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
            }}>
              {initial}
            </span>
            <Icon type="chevron-down" size={14} color={ADMIN_COLORS.medGray} />
          </button>

          {profileOpen && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220,
              background: ADMIN_COLORS.cardBg, border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 8,
              boxShadow: "0 12px 28px rgba(27,42,74,0.14)", padding: 8, zIndex: 60,
            }}>
              <div style={{ padding: "8px 10px", fontSize: 12, color: ADMIN_COLORS.medGray, wordBreak: "break-all" }}>
                Signed in as<br />
                <strong style={{ color: ADMIN_COLORS.navy, fontWeight: 600 }}>{email}</strong>
              </div>
              <div style={{ height: 1, background: ADMIN_COLORS.border, margin: "6px 0" }} />
              <button
                onClick={logout}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 10px",
                  background: "none", border: "none", borderRadius: 6, cursor: "pointer",
                  fontSize: 13, fontWeight: 600, color: ADMIN_COLORS.danger, textAlign: "left",
                }}
              >
                <Icon type="log-out" size={16} color={ADMIN_COLORS.danger} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .tm-admin-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); pointer-events: none; }
        @media (max-width: 900px) {
          .tm-admin-menu-btn { display: block !important; }
        }
      `}</style>
    </header>
  );
}

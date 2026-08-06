import { NavLink, Link } from "react-router-dom";
import { ADMIN_COLORS, ADMIN_NAV_ITEMS } from "../theme";
import Icon from "../../components/Icon";

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      <div
        onClick={onClose}
        className="tm-admin-overlay"
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 45, display: mobileOpen ? "block" : "none" }}
      />
      <aside
        className={`tm-admin-sidebar${mobileOpen ? " tm-admin-sidebar-open" : ""}`}
        style={{
          position: "fixed", top: 0, left: 0, width: 260, height: "100vh",
          background: ADMIN_COLORS.sidebarBg, display: "flex", flexDirection: "column",
          zIndex: 50, overflowY: "auto",
        }}
      >
        <div style={{
          padding: "22px 20px", borderBottom: `1px solid ${ADMIN_COLORS.sidebarBorder}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0,
        }}>
          <Link to="/admin" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <img src="/images/products/logo.png" alt="Trademarco Global" style={{ height: 26, width: "auto" }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>
              Admin
            </span>
          </Link>
          <button
            onClick={onClose}
            className="tm-admin-close-btn"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "none" }}
            aria-label="Close menu"
          >
            <Icon type="close" size={20} color="rgba(255,255,255,0.7)" />
          </button>
        </div>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 2 }}>
          {ADMIN_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) => `tm-admin-nav-link${isActive ? " tm-admin-nav-link-active" : ""}`}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 6, fontSize: 14, fontWeight: 500 }}
            >
              {({ isActive }) => (
                <>
                  <Icon type={item.icon} size={17} color={isActive ? ADMIN_COLORS.sidebarTextActive : "rgba(255,255,255,0.55)"} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "14px 20px", borderTop: `1px solid ${ADMIN_COLORS.sidebarBorder}`, fontSize: 11, color: "rgba(255,255,255,0.32)", flexShrink: 0 }}>
          Trademarco Global Admin &middot; Phase 1
        </div>
      </aside>

      <style>{`
        .tm-admin-nav-link { color: ${ADMIN_COLORS.sidebarText}; text-decoration: none; transition: background 0.15s ease, color 0.15s ease; }
        .tm-admin-nav-link:hover { background: rgba(255,255,255,0.06); color: ${ADMIN_COLORS.sidebarTextActive}; }
        .tm-admin-nav-link-active { background: ${ADMIN_COLORS.accent}; color: ${ADMIN_COLORS.sidebarTextActive} !important; }
        .tm-admin-sidebar { transition: transform 0.25s ease; }
        @media (max-width: 900px) {
          .tm-admin-sidebar { transform: translateX(-100%); }
          .tm-admin-sidebar-open { transform: translateX(0); }
          .tm-admin-close-btn { display: block !important; }
        }
        @media (min-width: 901px) {
          .tm-admin-overlay { display: none !important; }
        }
      `}</style>
    </>
  );
}

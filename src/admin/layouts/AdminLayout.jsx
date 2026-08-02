import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { ADMIN_COLORS } from "../theme";

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{
      minHeight: "100vh", background: ADMIN_COLORS.contentBg,
      fontFamily: "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: ADMIN_COLORS.darkGray,
    }}>
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="tm-admin-main">
        <TopBar onMenuClick={() => setMobileOpen(true)} />
        <main style={{ padding: 28 }}>{children}</main>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        .tm-admin-main { margin-left: 260px; min-height: 100vh; }
        @media (max-width: 900px) {
          .tm-admin-main { margin-left: 0; }
        }
      `}</style>
    </div>
  );
}

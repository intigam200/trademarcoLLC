import Icon from "./Icon";

export default function TopBar() {
  return (
    <div className="tm-topbar" style={{ background: "#141F35", height: 36 }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="mailto:info@trademarco.com" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(244, 237, 237, 0.94)", fontSize: 12, textDecoration: "none" }}>
            <Icon type="mail" size={13} color="rgba(244, 237, 237, 0.94)" />
            info@trademarco.com
          </a>
          <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.2)" }} />
          <a href="tel:+13079998667" style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(244, 237, 237, 0.94)", fontSize: 12, textDecoration: "none" }}>
            <Icon type="phone" size={13} color="rgba(244, 237, 237, 0.94)" />
            +1 (307) 999-8667
          </a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(244, 237, 237, 0.94)", fontSize: 12 }}>
          <Icon type="map-pin" size={13} color="rgba(244, 237, 237, 0.94)" />
          Wyoming, USA
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .tm-topbar { display: none; } }`}</style>
    </div>
  );
}

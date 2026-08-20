import { CONTACT_INFO } from "../data/content";
import Icon from "./Icon";

const WHATSAPP_HREF = CONTACT_INFO.find((c) => c.icon === "whatsapp")?.href;

// Floating action button, present on every public page (mounted once in
// MainLayout) — the fastest path to a human for a customer who doesn't want
// to fill in the RFQ form. Not shown in the admin panel.
export default function WhatsAppButton() {
  if (!WHATSAPP_HREF) return null;

  return (
    <>
      <a
        href={WHATSAPP_HREF}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="tm-whatsapp-fab"
        style={{
          position: "fixed", right: 24, bottom: 24, zIndex: 90,
          width: 56, height: 56, borderRadius: "50%",
          background: "#25D366", boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          textDecoration: "none",
        }}
      >
        <Icon type="whatsapp" size={28} color="#FFFFFF" />
      </a>
      <style>{`
        .tm-whatsapp-fab { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .tm-whatsapp-fab:hover { transform: scale(1.08); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
        @media (max-width: 640px) {
          .tm-whatsapp-fab { right: 16px; bottom: 16px; width: 50px; height: 50px; }
        }
      `}</style>
    </>
  );
}

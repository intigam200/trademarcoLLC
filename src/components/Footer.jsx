import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import Icon from "./Icon";

const TRUST_BADGES = [
  { icon: "shield-check", label: "Trusted Partners" },
  { icon: "check", label: "Quality Assured" },
  { icon: "globe", label: "Global Network" },
  { icon: "truck", label: "Reliable Delivery" },
];

const CONTACT_ROWS = [
  { icon: "map-pin", text: "30 N Gould St Ste N, Sheridan, WY 82801, USA" },
  { icon: "mail", text: "info@trademarco.com" },
  {  text: "sales@trademarco.com" },
  {  text: "support@trademarco.com" },
  { icon: "phone", text: "+1 (307) 999-8667" },
  { icon: "clock", text: "Mon – Fri: 8:00 AM – 7:00 PM (MT)" },
];

const SOCIAL_LINKS = [
  { icon: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/trademarco-llc/" },
];

function FooterHeading({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
      {children}
    </div>
  );
}

export default function Footer() {
  return (
    <footer style={{ background: "rgb(12, 20, 35)" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "64px 24px 0" }}>
        <div className="tm-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr", gap: 56 }}>

          {/* LEFT — brand */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <img src="/images/products/logo.png" alt="Trademarco Global" style={{ height: 80, width: "auto", display: "block" }} />
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0, maxWidth: 280, lineHeight: 1.7 }}>
              Based in Wyoming, USA, Trademarco Global connects industrial buyers with certified manufacturers in 40+ countries. From sourcing and quality control to logistics and customs — we handle the entire supply chain.
            </p>
            <div style={{ display: "flex", gap: 16, marginTop: 28 }}>
              {TRUST_BADGES.map((b) => (
                <div key={b.label} className="tm-hover-icon" style={{ textAlign: "center", width: 62 }}>
                  <div className="tm-footer-badge-circle" style={{
                    width: 36, height: 36, borderRadius: "50%", margin: "0 auto 8px",
                    background: "rgba(255,255,255,0.03)", border: `1px solid rgba(45,114,210,0.35)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "border-color 0.3s ease",
                  }}>
                    <Icon type={b.icon} size={17} color={COLORS.orange} />
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>{b.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CENTER — contact */}
          <div>
            <FooterHeading>Contact Us</FooterHeading>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {CONTACT_ROWS.map((row) => (
                <div key={row.text} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  {row.icon ? (
                    <Icon type={row.icon} size={16} color={COLORS.orange} />
                  ) : (
                    <div style={{ width: 16, flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{row.text}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
              {SOCIAL_LINKS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="tm-footer-social" style={{
                  width: 34, height: 34, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
                }}>
                  <Icon type={s.icon} size={15} color="rgba(255,255,255,0.4)" />
                </a>
              ))}
            </div>
          </div>

          {/* RIGHT — headquarters map */}
          <div className="tm-footer-hq">
            <FooterHeading>Our Headquarters</FooterHeading>
            <div className="tm-footer-map" style={{ position: "relative", borderRadius: 8, overflow: "hidden" }}>
              <iframe
                title="Trademarco Global headquarters — Sheridan, Wyoming"
                src="https://maps.google.com/maps?q=30%20N%20Gould%20St%20Ste%20N%2C%20Sheridan%2C%20WY%2082801%2C%20USA&z=14&output=embed"
                width="100%"
                height="220"
                style={{ border: 0, maxWidth: 600, display: "block" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16 }}>
              
              <p style={{ fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.45)", margin: 0, lineHeight: 1.5 }}>
                Proudly based in Sheridan, Wyoming, in the heart of America.
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 48, padding: "24px 0 32px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>© 2026 TRADEMARCO LLC. All rights reserved.</span>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <Link to="/privacy-policy" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Privacy Policy</Link>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link to="/terms-of-service" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Terms of Service</Link>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>|</span>
            <Link to="/cookie-policy" style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Cookie Policy</Link>
          </div>
        </div>
      </div>

      <style>{`
        .tm-hover-icon:hover .tm-footer-badge-circle {
          border-color: ${COLORS.orange};
        }
        .tm-footer-social:hover svg {
          color: #FFFFFF;
        }
        .tm-footer-social:hover {
          border-color: rgba(255,255,255,0.5);
        }
        @media (max-width: 900px) {
          .tm-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .tm-footer-hq { grid-column: 1 / -1; }
        }
        @media (max-width: 640px) {
          .tm-footer-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .tm-footer-map { display: none; }
        }
      `}</style>
    </footer>
  );
}

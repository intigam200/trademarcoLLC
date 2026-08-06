import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { NAV_LINKS } from "../data/content";
import Icon from "./Icon";
import Button from "./Button";

export default function Navbar() {
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const closeMobileNav = () => setMobileNav(false);

  return (
    <nav style={{
      position: "sticky", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgb(12, 20, 35)",
      backdropFilter: scrolled ? "blur(8px)" : "none",
      transition: "backdrop-filter 0.3s ease, border-color 0.3s ease",
      borderBottom: scrolled ? "1px solid rgba(255, 255, 255, 0.07)" : "1px solid rgba(255, 255, 255, 0)",
    }}>
      <div className="tm-navbar-inner" style={{ maxWidth: 1160, height: 97, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", cursor: "pointer", textDecoration: "none", marginRight: 32, flexShrink: 0 }}>
          <img className="tm-navbar-logo" src="/images/products/logo.png" alt="Trademarco Global" style={{ height: 56, width: "auto", display: "block" }} />
        </Link>

        {/* Desktop */}
        <div style={{ display: "flex", alignItems: "center", gap: 36 }} className="desktop-nav">
          {NAV_LINKS.map((l) => (
            l.href.includes("#") ? (
              <a key={l.label} href={l.href} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.target.style.color = COLORS.white}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.8)"}>
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.href} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.target.style.color = COLORS.white}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.8)"}>
                {l.label}
              </Link>
            )
          ))}
          <Button as="a" href="/#contact" variant="primary" style={{ padding: "10px 24px", fontSize: 13 }}>
            Request a Quote
          </Button>
        </div>

        {/* Mobile burger */}
        <button onClick={() => setMobileNav(!mobileNav)} className="mobile-burger" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <Icon type={mobileNav ? "close" : "menu"} size={28} color={COLORS.white} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileNav && (
        <div style={{ background: COLORS.navy, padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }} className="mobile-menu">
          {NAV_LINKS.map((l) => (
            l.href.includes("#") ? (
              <a key={l.label} href={l.href} onClick={closeMobileNav} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500, textDecoration: "none", padding: "4px 0" }}>
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.href} onClick={closeMobileNav} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500, textDecoration: "none", padding: "4px 0" }}>
                {l.label}
              </Link>
            )
          ))}
          <Button as="a" href="/#contact" onClick={closeMobileNav} variant="primary" style={{ marginTop: 8, justifyContent: "center" }}>
            Request a Quote
          </Button>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .tm-navbar-inner { height: 68px !important; }
          .tm-navbar-logo { height: 44px !important; }
        }
        @media (max-width: 768px) {
          .tm-navbar-inner { height: 60px !important; padding: 0 20px !important; }
          .tm-navbar-logo { height: 36px !important; }
        }
      `}</style>
    </nav>
  );
}

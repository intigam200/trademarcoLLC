import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { Section } from "./Section";
import Icon from "./Icon";

// Shared paragraph/list primitives so every legal page's content array reads
// as plain JSX without re-declaring the same typography styles per section.
export function LegalP({ children, style = {} }) {
  return (
    <p style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.medGray, margin: "0 0 16px", ...style }}>
      {children}
    </p>
  );
}

export function LegalList({ items }) {
  return (
    <ul style={{ margin: "0 0 16px", padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: 15, lineHeight: 1.7, color: COLORS.medGray }}>{item}</li>
      ))}
    </ul>
  );
}

// Shared hero + breadcrumb + sticky table-of-contents shell used by Privacy
// Policy, Terms of Service and Cookie Policy — identical chrome across all
// three, only the eyebrow/title/intro/sections differ per page.
export default function LegalLayout({ eyebrow, title, intro, lastUpdated, sections }) {
  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        background: COLORS.navy,
        backgroundImage: "radial-gradient(ellipse 700px 100% at 30% 0%, rgba(45,114,210,0.16), transparent 60%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>
              {eyebrow}
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              {title}
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 24px" }}>
              {intro}
            </p>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600,
              color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)", borderRadius: 20, padding: "8px 16px",
            }}>
              <Icon type="calendar" size={14} color={COLORS.orange} />
              Last Updated: {lastUpdated}
            </div>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>{title}</span>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <Section bg={COLORS.white}>
        <div className="tm-legal-grid" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 56, alignItems: "start" }}>
          {/* LEFT — sticky table of contents */}
          <nav className="tm-legal-toc" style={{ position: "sticky", top: 100 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.medGray, marginBottom: 16 }}>
              On This Page
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="tm-legal-toc-item"
                  style={{
                    display: "block", padding: "8px 12px", fontSize: 13, fontWeight: 500,
                    color: COLORS.medGray, textDecoration: "none", borderLeft: "2px solid transparent",
                    borderRadius: 4, lineHeight: 1.4,
                  }}
                >
                  {s.heading}
                </a>
              ))}
            </div>
          </nav>

          {/* RIGHT — sections */}
          <div>
            {sections.map((s) => (
              <section key={s.id} id={s.id} style={{ marginBottom: 44, scrollMarginTop: 96 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
                  {s.heading}
                </h2>
                {s.body}
              </section>
            ))}

            <div style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: "28px 32px", marginTop: 8 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 8px" }}>Questions about this policy?</h3>
              <p style={{ fontSize: 14, color: COLORS.medGray, margin: 0, lineHeight: 1.6 }}>
                Contact TradeMarco LLC at{" "}
                <a href="mailto:info@trademarco.com" style={{ color: COLORS.orange, fontWeight: 600, textDecoration: "none" }}>info@trademarco.com</a>
                {" "}or{" "}
                <a href="mailto:support@trademarco.com" style={{ color: COLORS.orange, fontWeight: 600, textDecoration: "none" }}>support@trademarco.com</a>.
              </p>
            </div>
          </div>
        </div>

        <style>{`
          .tm-legal-toc-item:hover { background: ${COLORS.lightGray}; color: ${COLORS.navy}; }
          .tm-legal-toc-item.active,
          .tm-legal-toc-item:target { border-left-color: ${COLORS.orange}; color: ${COLORS.navy} !important; font-weight: 600; }
          @media (max-width: 900px) {
            .tm-legal-grid { grid-template-columns: 1fr !important; }
            .tm-legal-toc { position: static !important; }
          }
        `}</style>
      </Section>
    </>
  );
}

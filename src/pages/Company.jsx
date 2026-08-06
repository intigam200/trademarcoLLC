import { useEffect } from "react";
import { COLORS } from "../theme/colors";
import { COMPANY_INFO } from "../data/content";
import { setSEO } from "../lib/seo";
import { Section, SectionLabel, SectionTitle } from "../components/Section";
import Icon from "../components/Icon";
import Button from "../components/Button";

export default function Company() {
  useEffect(() => {
    setSEO({
      title: "About Trademarco Global",
      description: "TRADEMARCO LLC is a U.S.-registered industrial sourcing and procurement company based in Wyoming, supplying industrial automation, valves, instrumentation and electrical equipment worldwide.",
      path: "/company",
    });
  }, []);

  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        background: COLORS.navy,
        backgroundImage: "radial-gradient(ellipse 700px 100% at 30% 0%, rgba(45,114,210,0.16), transparent 60%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 640 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>
              TRADEMARCO LLC
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Built for Global Industrial Supply
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }}>
              TRADEMARCO LLC is a U.S.-registered industrial sourcing and procurement company based in Wyoming.
            </p>
          </div>
        </div>
      </section>

      {/* ── COMPANY INFORMATION ── */}
      <Section bg={COLORS.white}>
        <SectionLabel>Company Information</SectionLabel>
        <SectionTitle>Legal Information</SectionTitle>
        <div className="tm-company-info-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", marginTop: 40,
          border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, overflow: "hidden",
        }}>
          {COMPANY_INFO.map((f) => (
            <div key={f.label} className="tm-company-info-cell" style={{ padding: "28px 24px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.medGray, marginBottom: 8 }}>
                {f.label}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, lineHeight: 1.4 }}>
                {f.value}
              </div>
            </div>
          ))}
        </div>

        <style>{`
          .tm-company-info-cell { border-left: 1px solid ${COLORS.borderGray}; }
          .tm-company-info-cell:first-child { border-left: none; }
          @media (max-width: 768px) {
            .tm-company-info-grid { grid-template-columns: 1fr 1fr !important; }
            .tm-company-info-cell { border-left: none !important; border-top: 1px solid ${COLORS.borderGray}; }
            .tm-company-info-cell:nth-child(1), .tm-company-info-cell:nth-child(2) { border-top: none; }
            .tm-company-info-cell:nth-child(even) { border-left: 1px solid ${COLORS.borderGray} !important; }
          }
          @media (max-width: 480px) {
            .tm-company-info-grid { grid-template-columns: 1fr !important; }
            .tm-company-info-cell { border-left: none !important; border-top: 1px solid ${COLORS.borderGray}; }
            .tm-company-info-cell:first-child { border-top: none; }
          }
        `}</style>
      </Section>

      {/* ── COMPANY REGISTRATION ── */}
      <Section bg={COLORS.lightGray}>
        <div className="tm-company-reg-grid" style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 64, alignItems: "center" }}>
          {/* LEFT */}
          <div>
            <SectionLabel>Company Registration</SectionLabel>
            <h3 style={{ fontSize: "clamp(24px, 2.8vw, 32px)", fontWeight: 800, color: COLORS.navy, margin: "0 0 16px", lineHeight: 1.2, letterSpacing: "-0.01em" }}>
              U.S.-Registered Company
            </h3>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: COLORS.medGray, margin: 0, maxWidth: 460 }}>
              TRADEMARCO LLC is registered in Wyoming, USA. Company registration documentation is available for verification. The company was founded by former highly qualified specialists of large oil and gas companies.
            </p>
          </div>

          {/* RIGHT — document card */}
          <a
            href="/documents/trademarco-certificate-of-organization.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="tm-doc-card"
            style={{
              display: "block", background: COLORS.white, border: `1px solid ${COLORS.borderGray}`,
              borderRadius: 10, padding: 24, textDecoration: "none", transition: "box-shadow 0.2s ease, transform 0.2s ease",
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 10px 30px rgba(27,42,74,0.12)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>TRADEMARCO LLC</div>
                <div style={{ fontSize: 12, color: COLORS.medGray, marginTop: 2 }}>Wyoming, USA</div>
              </div>
              <Icon type="document" size={20} color={COLORS.orange} />
            </div>
            <div style={{ border: `1px solid ${COLORS.borderGray}`, borderRadius: 6, overflow: "hidden", background: COLORS.lightGray }}>
              <img
                src="/documents/certificate-preview.jpg"
                alt="TRADEMARCO LLC Certificate of Organization, issued by the Wyoming Secretary of State"
                style={{ width: "100%", display: "block" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 18, fontSize: 14, fontWeight: 600, color: COLORS.orange }}>
              View Full Document
              <Icon type="arrow-right" size={16} color={COLORS.orange} className="tm-doc-arrow" />
            </div>
          </a>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .tm-company-reg-grid { grid-template-columns: 1fr !important; }
          }
          .tm-doc-arrow { transition: transform 0.2s ease; }
          .tm-doc-card:hover .tm-doc-arrow { transform: translateX(4px); }
        `}</style>
      </Section>

      {/* ── TRUST ── */}
      <section style={{ background: COLORS.navy }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <SectionLabel>What We Do</SectionLabel>
          <p style={{ fontSize: "clamp(18px, 2.2vw, 23px)", fontWeight: 500, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: 0 }}>
            Trademarco Global connects industrial buyers with manufacturers and suppliers worldwide, supporting sourcing, procurement and supply coordination for industrial equipment and components.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <Section bg={COLORS.white}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <SectionTitle style={{ textAlign: "center" }}>
            Looking for a specific industrial product?
          </SectionTitle>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: COLORS.medGray, margin: "0 0 32px" }}>
            Send us your requirements and our team will help identify suitable sourcing options.
          </p>
          <Button as="a" href="/#contact" variant="primary" style={{ margin: "0 auto", width: "fit-content" }}>
            Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
        </div>
      </Section>
    </>
  );
}

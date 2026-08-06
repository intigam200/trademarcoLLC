import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { OEM_FEATURES } from "../data/content";
import { listManufacturers } from "../lib/supabase/manufacturers";
import { setSEO } from "../lib/seo";
import { Section, SectionLabel, SectionTitle } from "../components/Section";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import Button from "../components/Button";

export default function Manufacturers() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSEO({
      title: "Industrial Equipment Manufacturers | TradeMarco Global",
      description: "Browse industrial equipment manufacturers and brands sourced by Trademarco Global — automation, valves, instrumentation, electrical equipment and more.",
      path: "/manufacturers",
    });
    listManufacturers({ status: "active" })
      .then(setManufacturers)
      .catch(() => {})
      .finally(() => setLoading(false));
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
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>
              Manufacturers
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Industrial Manufacturers
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 36px" }}>
              Explore the world&rsquo;s leading manufacturers of industrial valves, instrumentation, automation, filtration, sealing solutions and process equipment supplied by TradeMarco.
            </p>
            <Button as="a" href="/#contact" variant="primary">
              Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
            </Button>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>Manufacturers</span>
        </div>
      </div>

      {/* ── MANUFACTURERS GRID ── */}
      <Section bg={COLORS.lightGray}>
        <SectionLabel>Brands We Source</SectionLabel>
        <SectionTitle>Manufacturers</SectionTitle>
        {loading ? (
          <LoadingState label="Loading manufacturers…" />
        ) : manufacturers.length === 0 ? (
          <EmptyState icon="factory" title="No manufacturers yet" description="Manufacturers will appear here once they're published." />
        ) : (
        <div className="tm-mfr-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 24, marginTop: 40,
        }}>
          {manufacturers.map((m) => (
            <Link key={m.slug} to={`/manufacturers/${m.slug}`} className="tm-mfr-card" style={{
              display: "flex", flexDirection: "column", height: "100%",
              background: COLORS.white, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10,
              padding: 28, textDecoration: "none",
            }}>
              <div style={{
                height: 64, display: "flex", alignItems: "center", justifyContent: "flex-start",
                marginBottom: 20, flexShrink: 0,
              }}>
                {m.logo_url ? (
                  <div style={{
                    height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: m.logo_dark ? COLORS.navy : "transparent",
                    borderRadius: m.logo_dark ? 8 : 0,
                    padding: m.logo_dark ? "8px 14px" : 0,
                  }}>
                    <img src={m.logo_url} alt={`${m.name} logo`} style={{ maxWidth: 140, maxHeight: m.logo_dark ? 40 : "100%", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{
                    width: 56, height: 56, borderRadius: 8, background: COLORS.iconBlueBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 20, fontWeight: 800, color: COLORS.iconBlue,
                  }}>
                    {m.name.charAt(0)}
                  </div>
                )}
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: "0 0 8px" }}>{m.name}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.medGray, margin: "0 0 20px", flexGrow: 1 }}>{m.description}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, color: COLORS.orange }}>
                View Manufacturer
                <Icon type="arrow-right" size={16} color={COLORS.orange} className="tm-mfr-arrow" />
              </div>
            </Link>
          ))}
        </div>
        )}

        <p style={{ fontSize: 12, color: COLORS.medGray, lineHeight: 1.6, margin: "40px 0 0", fontStyle: "italic" }}>
          All manufacturer names, trademarks and logos are the property of their respective owners. TradeMarco LLC is an independent industrial sourcing company and is not an authorized distributor or representative of the manufacturers listed unless otherwise stated.
        </p>

        <style>{`
          .tm-mfr-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
          .tm-mfr-card:hover { box-shadow: 0 10px 25px rgba(27,42,74,0.12); transform: translateY(-4px); }
          .tm-mfr-arrow { transition: transform 0.2s ease; }
          .tm-mfr-card:hover .tm-mfr-arrow { transform: translateX(4px); }
          @media (max-width: 640px) {
            .tm-mfr-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          }
        `}</style>
      </Section>

      {/* ── WHY CHOOSE OEM MANUFACTURERS ── */}
      <Section bg={COLORS.white}>
        <SectionLabel>Why It Matters</SectionLabel>
        <SectionTitle>Why Choose OEM Manufacturers?</SectionTitle>
        <div className="tm-oem-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32, marginTop: 40,
        }}>
          {OEM_FEATURES.map((f) => (
            <div key={f.title}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.iconBlueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon type={f.icon} size={24} color={COLORS.iconBlue} />
              </div>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "16px 0 8px" }}>{f.title}</h4>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: COLORS.medGray, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>

        <style>{`
          @media (max-width: 900px) {
            .tm-oem-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
          @media (max-width: 480px) {
            .tm-oem-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </Section>

      {/* ── CTA ── */}
      <Section bg={COLORS.lightGray}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <SectionTitle style={{ textAlign: "center" }}>
            Looking for a Specific Manufacturer or Brand?
          </SectionTitle>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: COLORS.medGray, margin: "0 0 32px" }}>
            Send us your requirements and we&rsquo;ll help identify suitable sourcing options.
          </p>
          <Button as="a" href="/#contact" variant="primary" style={{ margin: "0 auto", width: "fit-content" }}>
            Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
        </div>
      </Section>
    </>
  );
}

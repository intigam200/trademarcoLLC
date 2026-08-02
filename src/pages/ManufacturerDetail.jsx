import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { MANUFACTURERS } from "../data/content";
import { Section } from "../components/Section";
import Icon from "../components/Icon";
import Button from "../components/Button";

export default function ManufacturerDetail() {
  const { slug } = useParams();
  const manufacturer = MANUFACTURERS.find((m) => m.slug === slug);

  useEffect(() => {
    document.title = manufacturer
      ? `${manufacturer.name} | TradeMarco Manufacturers`
      : "Manufacturer Not Found | TradeMarco";
  }, [manufacturer]);

  if (!manufacturer) {
    return (
      <Section bg={COLORS.white}>
        <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.navy, margin: "0 0 12px" }}>Manufacturer Not Found</h1>
          <p style={{ fontSize: 15, color: COLORS.medGray, margin: "0 0 28px" }}>
            We couldn&rsquo;t find that manufacturer. Browse our full list instead.
          </p>
          <Button as={Link} to="/manufacturers" variant="primary">
            View All Manufacturers <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
        </div>
      </Section>
    );
  }

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
              Manufacturer
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              {manufacturer.name}
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }}>
              {manufacturer.desc}
            </p>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <Link to="/manufacturers" style={{ color: COLORS.medGray, textDecoration: "none" }}>Manufacturers</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>{manufacturer.name}</span>
        </div>
      </div>

      {/* ── COMING SOON ── */}
      <Section bg={COLORS.white}>
        <div style={{
          maxWidth: 620, margin: "0 auto", textAlign: "center",
          background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: "48px 32px",
        }}>
          {manufacturer.logo && (
            <div style={{
              height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28,
              background: manufacturer.logoDark ? COLORS.navy : "transparent",
              borderRadius: manufacturer.logoDark ? 8 : 0,
              padding: manufacturer.logoDark ? "10px 18px" : 0,
              width: "fit-content", margin: "0 auto 28px",
            }}>
              <img src={manufacturer.logo} alt={`${manufacturer.name} logo`} style={{ maxWidth: 180, maxHeight: manufacturer.logoDark ? 36 : "100%", objectFit: "contain" }} />
            </div>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: "0 0 12px" }}>
            Full {manufacturer.name} Product Profile Coming Soon
          </h2>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: COLORS.medGray, margin: "0 0 28px" }}>
            We&rsquo;re building out detailed sourcing information for {manufacturer.name}. In the meantime, send us your requirements and our team will help identify suitable {manufacturer.name} products and sourcing options.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Button as="a" href="/#contact" variant="primary">
              Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
            </Button>
            <Button as={Link} to="/manufacturers" variant="outline">
              View All Manufacturers
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}

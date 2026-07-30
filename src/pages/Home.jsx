import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { PRODUCTS, INDUSTRIES, INDUSTRIES_INFO, WHY_ITEMS, REGIONS, HOW_WE_WORK, ABOUT_FEATURES, CONTACT_INFO, BENEFIT_ITEMS, HERO_TRUST } from "../data/content";
import { Section, SectionLabel, SectionTitle, SectionDesc } from "../components/Section";
import Icon from "../components/Icon";
import Button from "../components/Button";
import ContactForm from "../components/ContactForm";

export default function Home() {
  return (
    <>
      {/* ── HERO ── */}
      <section id="hero" className="tm-hero-section" style={{
        background: COLORS.navy,
        display: "flex", alignItems: "center",
        position: "relative", overflow: "hidden",
      }}>
        {/* Photo — occupies the right ~60% of the hero. Its own left edge is feathered
            via mask-image so it dissolves into the navy background instead of reading
            as a cropped rectangle; the image itself stays sharp and true to color. */}
        <div className="tm-hero-photo" style={{
          position: "absolute", top: 0, bottom: 0, right: 0, width: "80%",
          backgroundImage: "url(/images/products/port1.png)",
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "brightness(1)",
          maskImage: "linear-gradient(90deg, transparent 0%, transparent 4%, black 28%)",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, transparent 4%, black 28%)",
        }} />

        {/* Navy wash — tinted (not solid) over the text column so the photo still
            reads through faintly there, then fades lighter across the rest so the
            photo becomes the visual accent rather than being buried under navy */}
        <div className="tm-hero-wash" style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(90deg, rgba(27,42,74,0.8) 25%, rgba(27,42,74,0.5) 50%, rgba(18, 29, 50, 0.1) 75%)`,
        }} />

        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "140px 40px 96px", position: "relative", zIndex: 1, width: "100%" }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 24 }}>
              International Industrial Supply
            </div>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 56px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.12, margin: "0 0 24px", letterSpacing: "-0.025em" }}>
              Industrial Equipment<br />& Parts — Worldwide
            </h1>
            <p style={{ fontSize: "clamp(16px, 1.8vw, 19px)", color: "rgb(255, 255, 255)", lineHeight: 1.7, margin: "0 0 40px", maxWidth: 520 }}>
              We source industrial equipment and components from qualified manufacturers worldwide — with competitive pricing, quality control, and reliable supply support.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 56 }}>
              <Button as="a" href="#contact" variant="primary" style={{ padding: "16px 32px", fontSize: 18, fontWeight: 600 }}>
                Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
              </Button>
              <Button as="a" href="#products" variant="secondary">
                View Products
              </Button>
            </div>

            <div className="tm-hero-trust" style={{ display: "flex", gap: 16, maxWidth: 640 }}>
              {HERO_TRUST.map((t) => (
                <div key={t.title} style={{
                  background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
                  borderRadius: 8, padding: 16, flex: 1,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 6 }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 13, color: "rgb(255, 255, 255)", lineHeight: 1.5 }}>
                    {t.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          .tm-hero-section {
            min-height: 80vh;
            min-height: 80svh;
          }
          @media (max-width: 768px) {
            .tm-hero-photo {
              width: 100% !important;
              mask-image: linear-gradient(180deg, transparent 0%, black 45%) !important;
              -webkit-mask-image: linear-gradient(180deg, transparent 0%, black 45%) !important;
              filter: brightness(0.55) !important;
            }
            .tm-hero-wash {
              background: linear-gradient(180deg, rgba(15,25,45,0.4) 0%, rgba(15,25,45,0.88) 55%, ${COLORS.navy} 100%) !important;
            }
            .tm-hero-trust {
              flex-wrap: wrap;
            }
            .tm-hero-trust > div {
              min-width: 45%;
            }
          }
        `}</style>
      </section>

      {/* ── BENEFIT BAR ── */}
      <div style={{ background: COLORS.white, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", position: "relative", zIndex: 2 }}>
        <div className="tm-benefit-grid" style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 40px",
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        }}>
          {BENEFIT_ITEMS.map((b, i) => (
            <div key={i} className="tm-benefit-item tm-hover-icon" style={{ padding: "32px 28px" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: COLORS.iconBlueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon type={b.icon} size={24} color={COLORS.iconBlue} />
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: "14px 0 6px" }}>{b.title}</h4>
              <p style={{ fontSize: 13, lineHeight: 1.55, color: COLORS.medGray, margin: 0 }}>{b.desc}</p>
            </div>
          ))}
        </div>

        <style>{`
          .tm-benefit-item { border-left: 1px solid ${COLORS.borderGray}; }
          .tm-benefit-item:first-child { border-left: none; }
          @media (max-width: 768px) {
            .tm-benefit-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .tm-benefit-item { border-left: none !important; border-top: 1px solid ${COLORS.borderGray}; }
            .tm-benefit-item:nth-child(1), .tm-benefit-item:nth-child(2) { border-top: none; }
            .tm-benefit-item:nth-child(even) { border-left: 1px solid ${COLORS.borderGray} !important; }
          }
        `}</style>
      </div>

      {/* ── PRODUCTS ── */}
      <Section id="products" bg={COLORS.lightGray} style={{
        backgroundImage: "radial-gradient(ellipse 420px 100% at left, rgba(45,114,210,0.07), transparent 60%), radial-gradient(ellipse 420px 100% at right, rgba(45,114,210,0.07), transparent 60%)",
      }}>
        <SectionLabel>Product Categories</SectionLabel>
        <SectionTitle>What We Supply</SectionTitle>
        <SectionDesc>
          From standard commodities to hard-to-find specialty items — we cover the full range of industrial equipment and components.
        </SectionDesc>
        <div className="tm-products-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20, marginTop: 48,
        }}>
          {PRODUCTS.map((p) => (
            <Link key={p.slug} to={`/products?category=${p.slug}`} className="tm-hover-icon tm-product-card" style={{
              display: "flex", flexDirection: "column", height: "100%",
              background: COLORS.white, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8,
              overflow: "hidden", textDecoration: "none",
            }}>
              <div style={{ height: 160, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={p.image} alt={p.title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>{p.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: COLORS.medGray, margin: "0 0 14px", flexGrow: 1 }}>{p.desc}</p>
                <Icon type="arrow-right" size={18} color={COLORS.orange} />
              </div>
            </Link>
          ))}
        </div>

        <style>{`
          .tm-product-card { transition: box-shadow 0.2s ease, transform 0.2s ease; }
          .tm-product-card:hover { box-shadow: 0 10px 25px rgba(27,42,74,0.12); transform: translateY(-4px); }
          @media (max-width: 640px) {
            .tm-products-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </Section>

      {/* ── INDUSTRIES ── */}
      <section id="industries" style={{ position: "relative", overflow: "hidden", background: COLORS.lightGray, scrollMarginTop: 64 }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(244,245,247,0.88), rgba(244,245,247,0.88)), url('/images/industries-bg.png')",
          backgroundSize: "cover", backgroundPosition: "center right",
        }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(244,245,247,0.88)" }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "88px 24px", position: "relative", zIndex: 1 }}>
          <div className="tm-ind-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40 }}>
            <div style={{ maxWidth: 560 }}>
              <SectionLabel>Industries</SectionLabel>
              <SectionTitle>Sectors We Serve</SectionTitle>
              <SectionDesc>
                Our sourcing capabilities cover the critical industries that keep global infrastructure running.
              </SectionDesc>
            </div>
            <img src="/images/products/shipment.png" alt="Global shipping" className="tm-ind-header-img" style={{
              width: 570, maxWidth: "75%", height: 240, objectFit: "cover", borderRadius: 'none',
              boxShadow: 'none', flexShrink: 0,
              maskImage: "radial-gradient(ellipse at center, black 55%, transparent 95%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 55%, transparent 95%)",
            }} />
          </div>
          <style>{`@media (max-width: 800px) { .tm-ind-header-img { display: none; } }`}</style>

          {/* Info bar */}
          <div className="tm-ind-infobar" style={{
            display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
            background: COLORS.white, borderRadius: 10, boxShadow: "0 4px 20px rgba(27,42,74,0.08)",
            marginTop: 40, overflow: "hidden",
          }}>
            {INDUSTRIES_INFO.map((it, i) => (
              <div key={i} className="tm-ind-info-item tm-hover-icon" style={{ display: "flex", alignItems: "center", gap: 14, padding: "24px 28px" }}>
                <Icon type={it.icon} size={36} color={COLORS.orange} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy }}>{it.title}</div>
                  <div style={{ fontSize: 13, color: COLORS.medGray, marginTop: 2 }}>{it.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Industry cards */}
          <div className="tm-ind-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 40 }}>
            {INDUSTRIES.map((ind, i) => (
              <div key={i} className="tm-ind-card tm-hover-icon" style={{
                display: "flex", alignItems: "center", gap: 16,
                background: COLORS.white, border: `1.5px solid ${COLORS.orange}`, borderRadius: 10,
                padding: 20, transition: "box-shadow 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(27,42,74,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ flexShrink: 0, width: 60, height: 60, borderRadius: "50%", background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon type={ind.icon} size={30} color={COLORS.orange} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: "0 0 4px" }}>{ind.name}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: COLORS.medGray, margin: 0 }}>{ind.desc}</p>
                </div>
                <Icon type="arrow-right" size={20} color={COLORS.orange} />
              </div>
            ))}
          </div>

          {/* CTA block */}
          <div className="tm-ind-cta" style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
            background: COLORS.white, borderRadius: 10, boxShadow: "0 4px 20px rgba(27,42,74,0.08)",
            padding: "32px 36px", marginTop: 40,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: "50%", background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon type="headset" size={28} color={COLORS.orange} />
              </div>
              <div>
                <h4 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>Need a Custom Sourcing Solution?</h4>
                <p style={{ fontSize: 14, color: COLORS.medGray, margin: 0, maxWidth: 420 }}>Our team will help you source the right products for your industry with speed, quality and reliability.</p>
              </div>
            </div>
            <div className="tm-ind-cta-right" style={{ textAlign: "right", flexShrink: 0 }}>
              <Button as="a" href="#contact" variant="primary">
                Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
              </Button>
              <div style={{ fontSize: 12, color: COLORS.medGray, marginTop: 10 }}>Fast response &bull; Tailored solutions &bull; Expert support</div>
            </div>
          </div>
        </div>

        <style>{`
          .tm-ind-info-item { border-left: 1px solid ${COLORS.borderGray}; }
          .tm-ind-info-item:first-child { border-left: none; }
          @media (max-width: 768px) {
            .tm-ind-infobar { grid-template-columns: 1fr !important; }
            .tm-ind-info-item { border-left: none !important; border-top: 1px solid ${COLORS.borderGray}; }
            .tm-ind-info-item:first-child { border-top: none; }
            .tm-ind-grid { grid-template-columns: 1fr !important; }
            .tm-ind-cta { flex-direction: column !important; align-items: flex-start !important; }
            .tm-ind-cta-right { text-align: left !important; width: 100%; }
          }
        `}</style>
      </section>

      {/* ── WHY TRADEMARCO ── */}
      <Section id="why" bg={COLORS.white}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 64, alignItems: "start" }}>
          <div>
            <SectionLabel>Why TradeMarco</SectionLabel>
            <SectionTitle>Your Sourcing Partner<br />for Industrial Projects</SectionTitle>
            <SectionDesc>
              We eliminate the complexity of international procurement. You tell us what you need — we find the right manufacturer, negotiate the best price, and deliver to your door.
            </SectionDesc>
            <Button as="a" href="#contact" variant="primary" style={{ marginTop: 32 }}>
              Get Started <Icon type="arrow-right" size={18} color={COLORS.white} />
            </Button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {WHY_ITEMS.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 3, background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                  <Icon type="check" size={20} color={COLORS.orange} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>{item.title}</h4>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: COLORS.medGray, margin: 0 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── GLOBAL SUPPLY NETWORK ── */}
      <Section id="network" bg={COLORS.navy} style={{
        backgroundImage: "linear-gradient(rgba(27,42,74,0.75), rgba(27,42,74,0.75)), url('/images/products/world.png')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
      }}>
        <div style={{ textAlign: "center" }}>
          <SectionLabel>Global Supply Network</SectionLabel>
          <SectionTitle color={COLORS.white} style={{ marginLeft: "auto", marginRight: "auto" }}>
            Sourcing from Every Major<br />Industrial Region
          </SectionTitle>
          <SectionDesc color="rgba(255,255,255,0.55)" style={{ margin: "0 auto" }}>
            Our network spans manufacturers across North America, Europe, the Middle East and Asia-Pacific — giving you access to the best products at the right price point.
          </SectionDesc>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1,
          marginTop: 56, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden",
        }}>
          {REGIONS.map((r, i) => (
            <div key={i} style={{ padding: "32px 24px", background: "rgba(255,255,255,0.03)", textAlign: "center" }}>
              <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}><Icon type={r.icon} size={28} color="rgba(255,255,255,0.4)" /></div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>{r.region}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 6 }}>{r.detail}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── ABOUT ── */}
      <section id="about" style={{ position: "relative", overflow: "hidden", background: "#F9FAFB", scrollMarginTop: 64 }}>
        {/* dotted world map — decorative, top right */}
        <svg width="480" height="260" viewBox="0 0 480 260" style={{ position: "absolute", top: 0, right: 0, zIndex: 0, pointerEvents: "none" }}>
          <defs>
            <pattern id="tm-about-dots" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.4" fill="rgba(27,42,74,0.06)" />
            </pattern>
          </defs>
          <ellipse cx="70" cy="70" rx="55" ry="42" fill="url(#tm-about-dots)" />
          <ellipse cx="110" cy="178" rx="28" ry="48" fill="url(#tm-about-dots)" />
          <ellipse cx="230" cy="55" rx="26" ry="22" fill="url(#tm-about-dots)" />
          <ellipse cx="235" cy="150" rx="34" ry="55" fill="url(#tm-about-dots)" />
          <ellipse cx="350" cy="75" rx="85" ry="50" fill="url(#tm-about-dots)" />
          <ellipse cx="430" cy="190" rx="30" ry="18" fill="url(#tm-about-dots)" />
        </svg>

        {/* port photo — small, bottom-left corner, dissolving into the background */}
        <div style={{
          position: "absolute", left: 0, bottom: 0, width: 700, height: 250,
          backgroundImage: "url('/images/products/port.png')",
          backgroundSize: "cover", backgroundPosition: "center",
          maskImage: "radial-gradient(circle at 0% 100%, black 15%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(circle at 0% 100%, black 15%, transparent 70%)",
          zIndex: 0, pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "88px 24px", position: "relative", zIndex: 1 }}>
          <div className="tm-about-grid" style={{ display: "grid", gridTemplateColumns: "55% 45%", gap: 64, alignItems: "start" }}>
            {/* LEFT */}
            <div>
              <SectionLabel>About TradeMarco</SectionLabel>
              <h2 style={{ fontSize: "clamp(28px, 3.6vw, 40px)", fontWeight: 800, color: COLORS.navy, margin: 0, lineHeight: 1.15, letterSpacing: "-0.01em" }}>
                An American Company with Global Reach
              </h2>
              <div style={{ width: 60, height: 3, background: COLORS.orange, margin: "24px 0" }} />
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#5A5F6B", margin: "0 0 20px" }}>
                TradeMarco LLC is registered in Wyoming, USA. We specialize in international procurement of industrial equipment, connecting buyers with verified manufacturers worldwide.
              </p>
              <p style={{ fontSize: 16, lineHeight: 1.75, color: "#5A5F6B", margin: "0 0 40px" }}>
                We are not a manufacturer. Our value is in sourcing the right products at the right price, managing quality control, and ensuring reliable delivery to any destination.
              </p>
              <div className="tm-about-features" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
                {ABOUT_FEATURES.map((f, i) => (
                  <div key={i} className="tm-hover-icon">
                    <Icon type={f.icon} size={36} color={COLORS.orange} />
                    <h5 style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, margin: "12px 0 4px" }}>{f.title}</h5>
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: COLORS.medGray, margin: 0 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — How We Work card */}
            <div style={{ background: COLORS.white, borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", padding: 40 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>How We Work</h4>
              <div style={{ width: 40, height: 3, background: COLORS.orange, margin: "12px 0 32px" }} />
              {HOW_WE_WORK.map((s, i) => (
                <div key={i} className="tm-hover-icon" style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative", paddingBottom: i < HOW_WE_WORK.length - 1 ? 32 : 0 }}>
                  {i < HOW_WE_WORK.length - 1 && (
                    <div style={{ position: "absolute", left: 19, top: 40, bottom: 0, borderLeft: `1px dashed ${COLORS.borderGray}` }} />
                  )}
                  <span style={{
                    flexShrink: 0, width: 40, height: 40, borderRadius: "50%", background: COLORS.orange,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: COLORS.white, fontWeight: 700, fontSize: 14, position: "relative", zIndex: 1,
                  }}>{s.step}</span>
                  <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: "50%", background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon type={s.icon} size={26} color={COLORS.medGray} />
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <h5 style={{ fontSize: 17, fontWeight: 700, color: COLORS.navy, margin: "0 0 4px" }}>{s.title}</h5>
                    <p style={{ fontSize: 14, lineHeight: 1.55, color: COLORS.medGray, margin: 0 }}>{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .tm-about-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 640px) {
            .tm-about-features { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </section>

      {/* ── CONTACT ── */}
      <Section id="contact" bg={COLORS.white}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 64 }}>
          <div>
            <SectionLabel>Contact</SectionLabel>
            <SectionTitle>Request a Quote</SectionTitle>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: COLORS.medGray, margin: "0 0 32px", maxWidth: 440 }}>
              Tell us what you need. Provide as much detail as possible — product type, specifications, quantity, destination — and we will get back to you with a competitive offer.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {CONTACT_INFO.map((c, i) => (
                <div key={i}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.navy, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{c.label}</div>
                  {c.href ? (
                    <a href={c.href} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: COLORS.medGray, textDecoration: "none" }}
                      onMouseEnter={e => e.currentTarget.style.color = COLORS.orange}
                      onMouseLeave={e => e.currentTarget.style.color = COLORS.medGray}>
                      {c.icon && <Icon type={c.icon} size={16} color="currentColor" />}
                      {c.value}
                    </a>
                  ) : (
                    <div style={{ fontSize: 15, color: COLORS.medGray }}>{c.value}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div>
            <ContactForm />
          </div>
        </div>
      </Section>
    </>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { INDUSTRIES } from "../data/content";
import { listCategories } from "../lib/supabase/categories";
import { setSEO, setJSONLD, SITE_URL } from "../lib/seo";
import { Section, SectionLabel, SectionTitle, SectionDesc } from "../components/Section";
import BrandMarquee from "../components/BrandMarquee";
import Icon from "../components/Icon";
import Button from "../components/Button";

function IndustryMedia({ industry }) {
  if (!industry.photo) {
    // No photograph for this sector yet — an icon panel keeps the row
    // balanced instead of leaving a hole where the image should be.
    return (
      <div className="tm-sector-media tm-sector-placeholder">
        <Icon type={industry.icon} size={72} color="rgba(255,255,255,0.45)" />
      </div>
    );
  }

  return (
    <img
      className="tm-sector-media"
      src={`/images/industries/${industry.photo}.webp`}
      srcSet={`/images/industries/${industry.photo}-sm.webp 720w, /images/industries/${industry.photo}.webp 1280w`}
      sizes="(max-width: 900px) 100vw, 560px"
      width={1280}
      height={854}
      loading="lazy"
      decoding="async"
      alt={`${industry.name} — ${industry.desc}`}
    />
  );
}

export default function Industries() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setSEO({
      title: "Industries We Serve | Trademarco Global",
      description: "Industrial sourcing for oil & gas, petrochemical, mining, marine, energy and manufacturing — valves, instrumentation, electrical equipment, pipes, filters and spare parts supplied worldwide.",
      path: "/industries",
    });
    setJSONLD({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Industries", item: `${SITE_URL}/industries` },
      ],
    });
    return () => setJSONLD(null);
  }, []);

  useEffect(() => {
    listCategories({ status: "active" }).then(setCategories).catch(() => {});
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
          <div style={{ maxWidth: 720 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>
              Industries
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Industries We Serve
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 36px" }}>
              The same catalogue serves very different plants. Below is what we supply into each sector,
              and how we handle sourcing when a part is obsolete, long-lead or simply hard to find.
            </p>

            <div className="tm-sector-jump">
              {INDUSTRIES.map((ind) => (
                <a key={ind.slug} href={`#${ind.slug}`} className="tm-sector-chip">
                  <Icon type={ind.icon} size={16} color={COLORS.orange} />
                  {ind.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>Industries</span>
        </div>
      </div>

      {/* ── SECTOR BLOCKS ── */}
      <section style={{ background: COLORS.white }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "88px 24px" }}>
          {INDUSTRIES.map((ind, i) => (
            <div key={ind.slug} id={ind.slug} className="tm-sector-row" style={{ scrollMarginTop: 90 }}>
              <IndustryMedia industry={ind} />

              <div className="tm-sector-body">
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", color: COLORS.orange }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ width: 28, height: 1, background: COLORS.borderGray }} />
                  <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.medGray }}>
                    {ind.desc}
                  </span>
                </div>

                <h2 style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 800, color: COLORS.navy, margin: "0 0 16px", letterSpacing: "-0.015em" }}>
                  {ind.name}
                </h2>
                <p style={{ fontSize: 15.5, lineHeight: 1.75, color: COLORS.medGray, margin: "0 0 24px" }}>
                  {ind.intro}
                </p>

                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.navy, marginBottom: 12 }}>
                  Typically supplied
                </div>
                <div className="tm-sector-supplies">
                  {ind.supplies.map((s) => (
                    <span key={s} className="tm-sector-supply">{s}</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 20, alignItems: "center", marginTop: 28, flexWrap: "wrap" }}>
                  <Button as={Link} to="/products" variant="primary">
                    Browse Catalogue <Icon type="arrow-right" size={16} color={COLORS.white} />
                  </Button>
                  <Link to="/#contact" style={{ fontSize: 14, fontWeight: 600, color: COLORS.orange, textDecoration: "none" }}>
                    Request a quote for this sector
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE SUPPLY ── */}
      <Section bg={COLORS.lightGray} style={{
        backgroundImage: "radial-gradient(ellipse 420px 100% at left, rgba(45,114,210,0.07), transparent 60%), radial-gradient(ellipse 420px 100% at right, rgba(45,114,210,0.07), transparent 60%)",
      }}>
        <SectionLabel>Product Categories</SectionLabel>
        <SectionTitle>Equipment We Supply Across Every Sector</SectionTitle>
        <SectionDesc>
          Whichever industry you operate in, sourcing runs through the same six categories —
          browse any of them, or send us a part number directly.
        </SectionDesc>

        <div className="tm-sector-cats" style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20, marginTop: 48,
        }}>
          {categories.map((c) => (
            <Link key={c.slug} to={`/products?category=${c.slug}`} className="tm-hover-icon tm-sector-cat" style={{
              display: "flex", flexDirection: "column", height: "100%",
              background: COLORS.white, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8,
              overflow: "hidden", textDecoration: "none",
            }}>
              <div style={{ height: 160, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <img src={c.image_url} alt={c.name} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>{c.name}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: COLORS.medGray, margin: "0 0 14px", flexGrow: 1 }}>{c.description}</p>
                <Icon type="arrow-right" size={18} color={COLORS.orange} />
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ── BRANDS ── */}
      <BrandMarquee />

      {/* ── CTA ── */}
      <Section bg={COLORS.white}>
        <div className="tm-sector-cta">
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: "50%", background: COLORS.lightGray, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon type="headset" size={28} color={COLORS.orange} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>
                Sourcing for a sector not listed here?
              </h2>
              <p style={{ fontSize: 14, color: COLORS.medGray, margin: 0, maxWidth: 460 }}>
                Send us the specification or part number and we&rsquo;ll come back with sourcing options
                and lead times.
              </p>
            </div>
          </div>
          <Button as={Link} to="/#contact" variant="primary">
            Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
        </div>
      </Section>

      <style>{`
        .tm-sector-jump { display: flex; flex-wrap: wrap; gap: 10px; }
        .tm-sector-chip {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.05);
          font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.85);
          text-decoration: none;
          transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }
        .tm-sector-chip:hover {
          background: rgba(255,255,255,0.12);
          border-color: rgba(255,255,255,0.35);
          color: #fff;
        }

        .tm-sector-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 56px;
          align-items: center;
          padding: 56px 0;
          border-top: 1px solid ${COLORS.borderGray};
        }
        .tm-sector-row:first-child { border-top: none; padding-top: 0; }
        .tm-sector-row:last-child { padding-bottom: 0; }
        /* Alternate which side the picture sits on, so the page doesn't read
           as six identical rows stacked on top of each other. */
        .tm-sector-row:nth-child(even) .tm-sector-media { order: 2; }

        .tm-sector-media {
          width: 100%;
          /* The width/height attributes are there to reserve the box before
             the file arrives, but a used height would win over aspect-ratio
             and render the photo at its full 854px. */
          height: auto;
          aspect-ratio: 3 / 2;
          object-fit: cover;
          border-radius: 12px;
          display: block;
          box-shadow: 0 12px 32px rgba(27,42,74,0.16);
        }
        .tm-sector-placeholder {
          display: flex; align-items: center; justify-content: center;
          background:
            radial-gradient(ellipse 70% 80% at 50% 30%, rgba(45,114,210,0.35), transparent 70%),
            linear-gradient(140deg, ${COLORS.navyLight} 0%, ${COLORS.navy} 100%);
        }

        .tm-sector-supplies { display: flex; flex-wrap: wrap; gap: 8px; }
        .tm-sector-supply {
          font-size: 13px; font-weight: 600; color: ${COLORS.navy};
          background: ${COLORS.lightGray};
          border: 1px solid ${COLORS.borderGray};
          border-radius: 6px;
          padding: 7px 12px;
        }

        .tm-sector-cat { transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .tm-sector-cat:hover { box-shadow: 0 10px 25px rgba(27,42,74,0.12); transform: translateY(-4px); }

        .tm-sector-cta {
          display: flex; align-items: center; justify-content: space-between;
          gap: 24px; flex-wrap: wrap;
          background: ${COLORS.white};
          border: 1px solid ${COLORS.borderGray};
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(27,42,74,0.08);
          padding: 32px 36px;
        }

        @media (max-width: 900px) {
          .tm-sector-row {
            grid-template-columns: 1fr;
            gap: 28px;
            padding: 44px 0;
          }
          .tm-sector-row:nth-child(even) .tm-sector-media { order: 0; }
        }
        @media (max-width: 640px) {
          .tm-sector-cats { grid-template-columns: repeat(2, 1fr) !important; }
          .tm-sector-cta { padding: 24px; }
        }
      `}</style>
    </>
  );
}

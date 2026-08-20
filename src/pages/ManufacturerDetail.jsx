import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { getManufacturerBySlug } from "../lib/supabase/manufacturers";
import { listProducts } from "../lib/supabase/products";
import { setSEO, setNoIndexSEO, setJSONLD, SITE_URL } from "../lib/seo";
import { Section } from "../components/Section";
import LoadingState from "../components/LoadingState";
import Icon from "../components/Icon";
import Button from "../components/Button";

const PAGE_SIZE = 12;

export default function ManufacturerDetail() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading", manufacturer: null, products: [] });
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", manufacturer: null, products: [] });
    setVisibleCount(PAGE_SIZE);
    getManufacturerBySlug(slug)
      .then(async (manufacturer) => {
        if (cancelled) return;
        if (!manufacturer) {
          setState({ status: "not-found", manufacturer: null, products: [] });
          return;
        }
        const products = await listProducts({ manufacturerId: manufacturer.id, status: "published" });
        if (cancelled) return;
        setState({ status: "ready", manufacturer, products });
      })
      .catch(() => { if (!cancelled) setState({ status: "not-found", manufacturer: null, products: [] }); });
    return () => { cancelled = true; };
  }, [slug]);

  const { status, manufacturer, products } = state;

  useEffect(() => {
    if (manufacturer) {
      setSEO({
        title: manufacturer.seo_title || `${manufacturer.name} Industrial Products | Trademarco Global`,
        description: manufacturer.seo_description || manufacturer.description || `Explore ${manufacturer.name} industrial products supplied worldwide by Trademarco Global.`,
        image: manufacturer.logo_url || undefined,
        path: `/manufacturers/${manufacturer.slug}`,
      });
      setJSONLD({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Manufacturers", item: `${SITE_URL}/manufacturers` },
          { "@type": "ListItem", position: 3, name: manufacturer.name, item: `${SITE_URL}/manufacturers/${manufacturer.slug}` },
        ],
      });
    } else if (status === "not-found") {
      setNoIndexSEO("Manufacturer Not Found | Trademarco Global");
      setJSONLD(null);
    }
    return () => setJSONLD(null);
  }, [manufacturer, status]);

  if (status === "loading") {
    return (
      <Section bg={COLORS.white}>
        <LoadingState label="Loading manufacturer…" minHeight={400} />
      </Section>
    );
  }

  if (status === "not-found") {
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
              {manufacturer.description}
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

      {products.length > 0 ? (
        /* ── PRODUCTS GRID ── */
        <Section bg={COLORS.lightGray}>
          <div className="tm-mfr-products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
            {products.slice(0, visibleCount).map((p) => (
              <Link key={p.id} to={`/manufacturers/${manufacturer.slug}/${p.slug}`} className="tm-mfr-product-card" style={{
                display: "flex", flexDirection: "column", background: COLORS.white,
                border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, overflow: "hidden", textDecoration: "none",
              }}>
                {p.image_url && (
                  <div style={{ height: 160, background: COLORS.lightGray, borderBottom: `1px solid ${COLORS.borderGray}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={p.image_url} alt={p.product_name} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.medGray, marginBottom: 8 }}>{p.part_number}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 8px" }}>{p.product_name}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.55, color: COLORS.medGray, margin: "0 0 16px", flexGrow: 1 }}>{p.short_description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: COLORS.orange }}>
                  View Product <Icon type="arrow-right" size={14} color={COLORS.orange} />
                </div>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
            <div style={{ fontSize: 13, color: COLORS.medGray }}>
              Showing {Math.min(visibleCount, products.length)} of {products.length} products
            </div>
            {visibleCount < products.length && (
              <Button variant="outline" onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}>
                Load More
              </Button>
            )}
          </div>

          <style>{`
            .tm-mfr-product-card { transition: box-shadow 0.2s ease, transform 0.2s ease; animation: tm-mfr-fade-in 0.35s ease; }
            .tm-mfr-product-card:hover { box-shadow: 0 10px 25px rgba(27,42,74,0.12); transform: translateY(-4px); }
            @keyframes tm-mfr-fade-in {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .tm-mfr-product-card { animation: none; }
            }
          `}</style>
        </Section>
      ) : (
        /* ── COMING SOON ── */
        <Section bg={COLORS.white}>
          <div style={{
            maxWidth: 620, margin: "0 auto", textAlign: "center",
            background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: "48px 32px",
          }}>
            {manufacturer.logo_url && (
              <div style={{
                height: 56, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28,
                background: manufacturer.logo_dark ? COLORS.navy : "transparent",
                borderRadius: manufacturer.logo_dark ? 8 : 0,
                padding: manufacturer.logo_dark ? "10px 18px" : 0,
                width: "fit-content", margin: "0 auto 28px",
              }}>
                <img src={manufacturer.logo_url} alt={`${manufacturer.name} logo`} style={{ maxWidth: 180, maxHeight: manufacturer.logo_dark ? 36 : "100%", objectFit: "contain" }} />
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
      )}
    </>
  );
}

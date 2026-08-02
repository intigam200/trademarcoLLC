import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { getProduct, getRelatedProducts, getCategoryInfo, getManufacturerInfo } from "../lib/catalog";
import { setSEO } from "../lib/seo";
import { Section, SectionLabel, SectionTitle } from "../components/Section";
import Icon from "../components/Icon";
import Button from "../components/Button";
import ContactForm from "../components/ContactForm";

export default function ProductDetail() {
  const { manufacturerSlug, productSlug } = useParams();
  const [state, setState] = useState({ status: "loading", product: null, related: [] });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", product: null, related: [] });
    (async () => {
      const product = await getProduct(manufacturerSlug, productSlug);
      if (cancelled) return;
      if (!product) {
        setState({ status: "not-found", product: null, related: [] });
        return;
      }
      const related = await getRelatedProducts(product);
      if (cancelled) return;
      setState({ status: "ready", product, related });
    })();
    return () => { cancelled = true; };
  }, [manufacturerSlug, productSlug]);

  const { status, product, related } = state;

  useEffect(() => {
    if (status === "ready" && product) {
      setSEO({ title: product.seo.title, description: product.seo.description });
    } else if (status === "not-found") {
      document.title = "Product Not Found | TradeMarco";
    }
  }, [status, product]);

  if (status === "loading") {
    return (
      <Section bg={COLORS.white}>
        <div style={{ padding: "80px 0", textAlign: "center", color: COLORS.medGray }}>Loading product...</div>
      </Section>
    );
  }

  if (status === "not-found") {
    return (
      <Section bg={COLORS.white}>
        <div style={{ maxWidth: 560, margin: "80px auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: COLORS.navy, margin: "0 0 12px" }}>Product Not Found</h1>
          <p style={{ fontSize: 15, color: COLORS.medGray, margin: "0 0 28px" }}>
            We couldn&rsquo;t find that product. Browse the manufacturer&rsquo;s page instead.
          </p>
          <Button as={Link} to={`/manufacturers/${manufacturerSlug}`} variant="primary">
            View Manufacturer <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
        </div>
      </Section>
    );
  }

  const manufacturer = getManufacturerInfo(product.manufacturer);
  const category = getCategoryInfo(product.category);
  const manufacturerName = manufacturer?.name || product.manufacturer;

  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        background: COLORS.navy,
        backgroundImage: "radial-gradient(ellipse 700px 100% at 30% 0%, rgba(45,114,210,0.16), transparent 60%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>
              {manufacturerName}{product.series ? ` — ${product.series}` : ""}
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 16px", letterSpacing: "-0.02em" }}>
              {product.productName}
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>
              Part Number: <strong style={{ color: COLORS.white }}>{product.partNumber}</strong>
            </p>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }}>
              {product.shortDescription}
            </p>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <Link to="/manufacturers" style={{ color: COLORS.medGray, textDecoration: "none" }}>Manufacturers</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <Link to={`/manufacturers/${product.manufacturer}`} style={{ color: COLORS.medGray, textDecoration: "none" }}>{manufacturerName}</Link>
          {category && (
            <>
              <span style={{ color: COLORS.borderGray }}>/</span>
              <Link to={`/products?category=${category.slug}`} style={{ color: COLORS.medGray, textDecoration: "none" }}>{category.title}</Link>
            </>
          )}
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>{product.partNumber}</span>
        </div>
      </div>

      {/* ── DETAILS ── */}
      <Section bg={COLORS.white}>
        <div className="tm-pd-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 56 }}>
          <div>
            <SectionLabel>Product Details</SectionLabel>
            <SectionTitle>Description</SectionTitle>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.medGray, margin: "0 0 32px", whiteSpace: "pre-line" }}>
              {product.longDescription}
            </p>

            {product.applications.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 14px" }}>Applications</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {product.applications.map((a) => (
                    <li key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.medGray }}>
                      <Icon type="check" size={16} color={COLORS.iconBlue} /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.alternativePartNumbers.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 14px" }}>Alternative / Cross-Reference Part Numbers</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {product.alternativePartNumbers.map((pn) => (
                    <span key={pn} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 4, background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, color: COLORS.navy }}>
                      {pn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 14px" }}>Related Products</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                  {related.map((r) => (
                    <Link key={r.id} to={`/manufacturers/${r.manufacturer}/${r.slug}`} style={{ display: "block", padding: 16, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, textDecoration: "none" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>{r.productName}</div>
                      <div style={{ fontSize: 12, color: COLORS.medGray }}>{r.partNumber}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: 28, position: "sticky", top: 100 }}>
              {product.rfqAvailable ? (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>Request a Quote</h3>
                  <p style={{ fontSize: 13, color: COLORS.medGray, margin: "0 0 20px" }}>
                    For {product.partNumber} — {manufacturerName}
                  </p>
                  <ContactForm initialMessage={`RFQ request for ${product.partNumber} (${product.productName}) — ${manufacturerName}.`} />
                </>
              ) : (
                <>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: "0 0 12px" }}>Contact Our Team</h3>
                  <p style={{ fontSize: 14, color: COLORS.medGray, lineHeight: 1.6, margin: "0 0 20px" }}>
                    This item is not available for direct RFQ. Contact our team to discuss sourcing options.
                  </p>
                  <Button as="a" href="/#contact" variant="primary" style={{ width: "100%", justifyContent: "center" }}>
                    Contact Us <Icon type="arrow-right" size={18} color={COLORS.white} />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .tm-pd-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </Section>
    </>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { getPublishedProductBySlugs, getRelatedProducts, listProducts } from "../lib/supabase/products";
import { setSEO, setNoIndexSEO } from "../lib/seo";
import { Section, SectionLabel, SectionTitle } from "../components/Section";
import LoadingState from "../components/LoadingState";
import Icon from "../components/Icon";
import Button from "../components/Button";
import ContactForm from "../components/ContactForm";

export default function ProductDetail() {
  const { manufacturerSlug, productSlug } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: "loading", product: null, related: [] });
  const [siblings, setSiblings] = useState({ prev: null, next: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", product: null, related: [] });
    setSiblings({ prev: null, next: null });
    (async () => {
      const product = await getPublishedProductBySlugs(manufacturerSlug, productSlug);
      if (cancelled) return;
      if (!product) {
        setState({ status: "not-found", product: null, related: [] });
        return;
      }
      const related = await getRelatedProducts(product.id);
      if (cancelled) return;
      setState({ status: "ready", product, related });
    })();
    return () => { cancelled = true; };
  }, [manufacturerSlug, productSlug]);

  const { status, product, related } = state;

  // Previous/Next — stable alphabetical-by-part-number order within the same
  // manufacturer, so the sequence doesn't shuffle as products are edited.
  useEffect(() => {
    if (status !== "ready" || !product) return;
    let cancelled = false;
    listProducts({ manufacturerId: product.manufacturer_id, status: "published" })
      .then((list) => {
        if (cancelled) return;
        const sorted = [...list].sort((a, b) => a.part_number.localeCompare(b.part_number, undefined, { numeric: true }));
        const idx = sorted.findIndex((p) => p.id === product.id);
        setSiblings({
          prev: idx > 0 ? sorted[idx - 1] : null,
          next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status, product]);

  useEffect(() => {
    if (status === "ready" && product) {
      const mfrName = product.manufacturer?.name ?? "";
      const label = [mfrName, product.part_number, product.product_name].filter(Boolean).join(" ");
      setSEO({
        title: product.seo_title || `${label} | TradeMarco Global`,
        description: product.seo_description || `Buy ${label} from Trademarco Global. Worldwide supplier of industrial automation products. Request a quotation today.`,
        image: product.image_url || undefined,
        type: "product",
        path: `/manufacturers/${manufacturerSlug}/${productSlug}`,
      });
    } else if (status === "not-found") {
      setNoIndexSEO("Product Not Found | TradeMarco Global");
    }
  }, [status, product, manufacturerSlug, productSlug]);

  const handleBack = () => {
    const canGoBack = window.history.state && typeof window.history.state.idx === "number" && window.history.state.idx > 0;
    if (canGoBack) navigate(-1);
    else navigate(`/manufacturers/${manufacturerSlug}`);
  };

  if (status === "loading") {
    return (
      <Section bg={COLORS.white}>
        <LoadingState label="Loading product…" minHeight={400} />
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

  const manufacturerName = product.manufacturer?.name || manufacturerSlug;
  const applications = product.applications ?? [];
  const alternativePartNumbers = product.alternative_part_numbers ?? [];
  const specs = [
    product.price != null && { label: "Price", value: `$${Number(product.price).toLocaleString()}` },
    product.size && { label: "Size", value: product.size },
    product.rating && { label: "Rating", value: product.rating },
    product.type && { label: "Type", value: product.type },
  ].filter(Boolean);

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
              {product.product_name}
            </h1>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", margin: "0 0 20px" }}>
              Part Number: <strong style={{ color: COLORS.white }}>{product.part_number}</strong>
            </p>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: 0 }}>
              {product.short_description}
            </p>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB + BACK ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div className="tm-pd-crumbbar" style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, flexWrap: "wrap", minWidth: 0 }}>
            <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
            <span style={{ color: COLORS.borderGray }}>/</span>
            <Link to="/manufacturers" style={{ color: COLORS.medGray, textDecoration: "none" }}>Manufacturers</Link>
            <span style={{ color: COLORS.borderGray }}>/</span>
            <Link to={`/manufacturers/${manufacturerSlug}`} style={{ color: COLORS.medGray, textDecoration: "none" }}>{manufacturerName}</Link>
            <span style={{ color: COLORS.borderGray }}>/</span>
            <span style={{ color: COLORS.navy, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 240 }} title={product.product_name}>
              {product.product_name}
            </span>
          </div>
          <button
            onClick={handleBack}
            style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: COLORS.navy, background: "transparent", border: "none", cursor: "pointer", padding: "6px 0", flexShrink: 0 }}
          >
            <Icon type="chevron-left" size={14} color={COLORS.navy} /> Back
          </button>
        </div>
      </div>

      {/* ── DETAILS ── */}
      <Section bg={COLORS.white}>
        <div className="tm-pd-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 56 }}>
          <div>
            {product.image_url && (
              <div style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: 24, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center", maxHeight: 360 }}>
                <img src={product.image_url} alt={product.product_name} style={{ maxWidth: "100%", maxHeight: 312, objectFit: "contain" }} />
              </div>
            )}
            <SectionLabel>Product Details</SectionLabel>
            <SectionTitle>Description</SectionTitle>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: COLORS.medGray, margin: "0 0 32px", whiteSpace: "pre-line" }}>
              {product.long_description || product.short_description}
            </p>

            {specs.length > 0 && (
              <div style={{ marginBottom: 32, display: "flex", flexWrap: "wrap", gap: 12 }}>
                {specs.map((s) => (
                  <div key={s.label} style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, padding: "10px 16px", minWidth: 100 }}>
                    <div style={{ fontSize: 11, color: COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>{s.value}</div>
                  </div>
                ))}
              </div>
            )}

            {applications.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 14px" }}>Applications</h3>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {applications.map((a) => (
                    <li key={a} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: COLORS.medGray }}>
                      <Icon type="check" size={16} color={COLORS.iconBlue} /> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {alternativePartNumbers.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 14px" }}>Alternative / Cross-Reference Part Numbers</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {alternativePartNumbers.map((pn) => (
                    <span key={pn} style={{ fontSize: 13, padding: "6px 12px", borderRadius: 4, background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, color: COLORS.navy }}>
                      {pn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: "0 0 14px" }}>Related Products</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
                  {related.map((r) => (
                    <Link key={r.id} to={`/manufacturers/${r.manufacturer?.slug}/${r.slug}`} style={{ display: "block", padding: 16, border: `1px solid ${COLORS.borderGray}`, borderRadius: 8, textDecoration: "none" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>{r.product_name}</div>
                      <div style={{ fontSize: 12, color: COLORS.medGray }}>{r.part_number}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(siblings.prev || siblings.next) && (
              <div className="tm-pd-siblings" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", paddingTop: 24, borderTop: `1px solid ${COLORS.borderGray}` }}>
                {siblings.prev ? (
                  <Link to={`/manufacturers/${manufacturerSlug}/${siblings.prev.slug}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", minWidth: 0 }}>
                    <Icon type="chevron-left" size={16} color={COLORS.orange} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, color: COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.04em" }}>Previous</span>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                        {siblings.prev.product_name}
                      </span>
                    </span>
                  </Link>
                ) : <span />}
                {siblings.next ? (
                  <Link to={`/manufacturers/${manufacturerSlug}/${siblings.next.slug}`} style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", minWidth: 0, marginLeft: "auto", textAlign: "right" }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 11, color: COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.04em" }}>Next</span>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                        {siblings.next.product_name}
                      </span>
                    </span>
                    <Icon type="chevron-right" size={16} color={COLORS.orange} />
                  </Link>
                ) : <span />}
              </div>
            )}
          </div>

          <div>
            <div style={{ position: "sticky", top: 100, display: "flex", flexDirection: "column", gap: 20 }}>
              {product.datasheet_url && (
                <a
                  href={product.datasheet_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tm-datasheet-card"
                  style={{ display: "flex", alignItems: "center", gap: 14, background: COLORS.white, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: "16px 18px", textDecoration: "none" }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: COLORS.iconBlueBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon type="document" size={20} color={COLORS.iconBlue} />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.navy }}>Product Datasheet</div>
                    <div style={{ fontSize: 12, color: COLORS.medGray }}>PDF Document</div>
                  </div>
                  <Icon type="download" size={18} color={COLORS.orange} />
                </a>
              )}

              <div style={{ background: COLORS.lightGray, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, padding: 28 }}>
                {product.rfq_available ? (
                  <>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: "0 0 6px" }}>Request a Quote</h3>
                    <p style={{ fontSize: 13, color: COLORS.medGray, margin: "0 0 20px" }}>
                      For {product.part_number} — {manufacturerName}
                    </p>
                    <ContactForm
                      productId={product.id}
                      manufacturerName={manufacturerName}
                      productName={product.product_name}
                      partNumber={product.part_number}
                      initialMessage="Please send pricing and lead time for this item."
                    />
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
        </div>

        <style>{`
          @media (max-width: 900px) {
            .tm-pd-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 560px) {
            .tm-pd-crumbbar { justify-content: flex-start !important; }
            .tm-pd-siblings > a { max-width: 100%; }
          }
        `}</style>
      </Section>
    </>
  );
}

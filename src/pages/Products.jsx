import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { listCategories } from "../lib/supabase/categories";
import { listProducts } from "../lib/supabase/products";
import { setSEO, setJSONLD, SITE_URL } from "../lib/seo";
import { Section, SectionTitle } from "../components/Section";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import Button from "../components/Button";

const PAGE_SIZE = 12;

function ProductCard({ p }) {
  return (
    <Link
      to={`/manufacturers/${p.manufacturer?.slug}/${p.slug}`}
      className="tm-cat-product-card"
      style={{ display: "flex", flexDirection: "column", background: COLORS.white, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, overflow: "hidden", textDecoration: "none" }}
    >
      {p.image_url && (
        <div style={{ height: 150, background: COLORS.lightGray, borderBottom: `1px solid ${COLORS.borderGray}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={p.image_url} alt={p.product_name} loading="lazy" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.medGray, marginBottom: 6 }}>{p.manufacturer?.name} — {p.part_number}</div>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy, margin: "0 0 8px" }}>{p.product_name}</h4>
        <p style={{ fontSize: 13, lineHeight: 1.5, color: COLORS.medGray, margin: "0 0 14px", flexGrow: 1 }}>{p.short_description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: COLORS.orange }}>
          View Product <Icon type="arrow-right" size={14} color={COLORS.orange} />
        </div>
      </div>
    </Link>
  );
}

function ProductGrid({ products, visibleCount, onLoadMore }) {
  return (
    <>
      <div className="tm-cat-products-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 24 }}>
        {products.slice(0, visibleCount).map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, marginTop: 40 }}>
        <div style={{ fontSize: 13, color: COLORS.medGray }}>
          Showing {Math.min(visibleCount, products.length)} of {products.length} products
        </div>
        {visibleCount < products.length && (
          <Button variant="outline" onClick={onLoadMore}>
            Load More
          </Button>
        )}
      </div>
    </>
  );
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get("category");
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCategories({ status: "active" }).then(setCategories).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const active = categories.find((c) => c.slug === activeSlug) || categories[0];

  const selectCategory = (slug) => setSearchParams({ category: slug });

  const [categoryProducts, setCategoryProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    setProductsLoading(true);
    listProducts({ categoryId: active.id, status: "published" })
      .then((data) => { if (!cancelled) { setCategoryProducts(data); setVisibleCount(PAGE_SIZE); } })
      .catch(() => { if (!cancelled) setCategoryProducts([]); })
      .finally(() => { if (!cancelled) setProductsLoading(false); });
    return () => { cancelled = true; };
  }, [active]);

  // Sitewide product search — independent of the category browser below.
  // Debounced so we don't fire a query on every keystroke, and only kicks in
  // once there's enough text to make a search meaningful.
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const isSearching = searchQuery.length >= 2;

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return; }
    let cancelled = false;
    setSearchLoading(true);
    listProducts({ search: searchQuery, status: "published" })
      .then((data) => { if (!cancelled) { setSearchResults(data); setVisibleCount(PAGE_SIZE); } })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [searchQuery]);

  useEffect(() => {
    if (active) {
      setSEO({
        title: active.seo_title || `${active.name} | Industrial Products | Trademarco Global`,
        description: active.seo_description || active.full_description || `Browse ${active.name} industrial products and equipment supplied by Trademarco Global. Request a quotation today.`,
        path: `/products?category=${active.slug}`,
      });
      setJSONLD({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: "Products", item: `${SITE_URL}/products` },
          { "@type": "ListItem", position: 3, name: active.name, item: `${SITE_URL}/products?category=${active.slug}` },
        ],
      });
    } else if (!loading) {
      setSEO({
        title: "Industrial Equipment & Components | Trademarco Global",
        description: "Browse industrial equipment and components sourced from qualified manufacturers worldwide by Trademarco Global. Request a quotation today.",
        path: "/products",
      });
    }
    return () => setJSONLD(null);
  }, [active, loading]);

  return (
    <>
      {/* ── HERO ── */}
      <section style={{
        background: COLORS.navy,
        backgroundImage: "radial-gradient(ellipse 700px 100% at 30% 0%, rgba(45,114,210,0.16), transparent 60%)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "120px 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>
              Our Products
            </div>
            <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              Industrial Equipment &amp; Components
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, margin: "0 0 32px" }}>
              From standard industrial equipment to hard-to-find components, Trademarco Global helps customers source products from qualified manufacturers and suppliers worldwide.
            </p>

            <div style={{ position: "relative", maxWidth: 440 }}>
              <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", display: "flex" }}>
                <Icon type="search" size={17} color="rgba(255,255,255,0.5)" />
              </div>
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by product name or part number…"
                aria-label="Search products"
                style={{
                  width: "100%", padding: "13px 16px 13px 44px", fontSize: 14, fontFamily: "inherit",
                  border: "1px solid rgba(255,255,255,0.18)", borderRadius: 4, outline: "none",
                  background: "rgba(255,255,255,0.06)", color: COLORS.white,
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex",
                  }}
                >
                  <Icon type="close" size={14} color="rgba(255,255,255,0.6)" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── BREADCRUMB ── */}
      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <Link to="/products" style={{ color: COLORS.medGray, textDecoration: "none" }}>Products</Link>
          {!isSearching && active && (
            <>
              <span style={{ color: COLORS.borderGray }}>/</span>
              <span style={{ color: COLORS.navy, fontWeight: 600 }}>{active.name}</span>
            </>
          )}
        </div>
      </div>

      {isSearching ? (
        /* ── SEARCH RESULTS ── */
        <Section bg={COLORS.white}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy, margin: 0 }}>
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <button
              type="button"
              onClick={() => setSearchInput("")}
              style={{ fontSize: 13, fontWeight: 600, color: COLORS.orange, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              Clear search
            </button>
          </div>

          {searchLoading ? (
            <LoadingState label="Searching…" />
          ) : searchResults && searchResults.length > 0 ? (
            <ProductGrid products={searchResults} visibleCount={visibleCount} onLoadMore={() => setVisibleCount((v) => v + PAGE_SIZE)} />
          ) : (
            <EmptyState icon="search" title="No products found" description="Try a different product name or part number, or browse by category instead." />
          )}

          <style>{`
            .tm-cat-product-card { transition: box-shadow 0.2s ease, transform 0.2s ease; animation: tm-cat-fade-in 0.35s ease; }
            .tm-cat-product-card:hover { box-shadow: 0 10px 25px rgba(27,42,74,0.12); transform: translateY(-4px); }
            @keyframes tm-cat-fade-in {
              from { opacity: 0; transform: translateY(4px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @media (prefers-reduced-motion: reduce) {
              .tm-cat-product-card { animation: none; }
            }
          `}</style>
        </Section>
      ) : (
      /* ── CATEGORY EXPLORER ── */
      <Section bg={COLORS.white}>
        {loading ? (
          <LoadingState label="Loading categories…" />
        ) : !active ? (
          <EmptyState icon="box" title="No categories yet" description="Product categories will appear here once they're published." />
        ) : (
        <div className="tm-products-grid" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 40, alignItems: "start" }}>
          {/* LEFT — category nav */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.medGray, marginBottom: 16 }}>
              Products
            </div>
            <div className="tm-cat-nav" style={{ display: "flex", flexDirection: "column" }}>
              {categories.map((c) => {
                const isActive = c.slug === active.slug;
                return (
                  <button
                    key={c.slug}
                    onClick={() => selectCategory(c.slug)}
                    className={`tm-cat-nav-item${isActive ? " tm-cat-nav-item-active" : ""}`}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "13px 16px", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                      textAlign: "left", cursor: "pointer", border: "none", borderLeft: "3px solid transparent",
                      background: "transparent", color: COLORS.medGray, transition: "background 0.15s ease, color 0.15s ease",
                    }}
                  >
                    {c.name}
                    <Icon type="arrow-right" size={14} color={isActive ? COLORS.orange : COLORS.borderGray} className="tm-cat-nav-arrow" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT — detail pane (own grid, re-keyed per category for the fade transition) */}
          <div key={active.slug} className="tm-cat-detail" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
            <div style={{ background: COLORS.lightGray, borderRadius: 10, border: `1px solid ${COLORS.borderGray}`, overflow: "hidden" }}>
              <div style={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
                <img src={active.image_url} alt={active.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
            </div>

            <div>
              <h2 style={{ fontSize: "clamp(24px, 2.6vw, 30px)", fontWeight: 800, color: COLORS.navy, margin: "0 0 14px", letterSpacing: "-0.01em" }}>
                {active.name}
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: COLORS.medGray, margin: "0 0 28px", maxWidth: 420 }}>
                {active.full_description}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px 24px" }}>
                {(active.types ?? []).map((t) => (
                  <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: COLORS.navy }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.orange, flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {active && !productsLoading && categoryProducts.length > 0 && (
          <div style={{ marginTop: 56, paddingTop: 40, borderTop: `1px solid ${COLORS.borderGray}` }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: COLORS.navy, margin: "0 0 24px" }}>
              {active.name} Products
            </h3>
            <ProductGrid products={categoryProducts} visibleCount={visibleCount} onLoadMore={() => setVisibleCount((v) => v + PAGE_SIZE)} />
          </div>
        )}

        <style>{`
          .tm-cat-product-card { transition: box-shadow 0.2s ease, transform 0.2s ease; animation: tm-cat-fade-in 0.35s ease; }
          .tm-cat-product-card:hover { box-shadow: 0 10px 25px rgba(27,42,74,0.12); transform: translateY(-4px); }
          .tm-cat-nav-item:hover { background: ${COLORS.lightGray}; color: ${COLORS.navy}; }
          .tm-cat-nav-item-active { background: rgba(45,114,210,0.06); color: ${COLORS.navy} !important; border-left-color: ${COLORS.orange} !important; }
          .tm-cat-detail { animation: tm-cat-fade-in 0.25s ease; }
          @keyframes tm-cat-fade-in {
            from { opacity: 0; transform: translateY(4px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .tm-cat-detail, .tm-cat-product-card { animation: none; }
          }
          @media (max-width: 900px) {
            .tm-products-grid { grid-template-columns: 1fr !important; }
            .tm-cat-detail { grid-template-columns: 1fr !important; gap: 32px !important; }
            .tm-cat-nav { flex-direction: row !important; flex-wrap: wrap; gap: 8px; }
            .tm-cat-nav-item { border-left: none !important; border: 1px solid ${COLORS.borderGray}; border-radius: 20px; padding: 8px 16px !important; }
            .tm-cat-nav-item-active { border-color: ${COLORS.orange} !important; }
          }
        `}</style>
      </Section>
      )}

      {/* ── CTA ── */}
      <Section bg={COLORS.lightGray}>
        <div style={{ maxWidth: 620, margin: "0 auto", textAlign: "center" }}>
          <SectionTitle style={{ textAlign: "center" }}>
            Looking for a specific product?
          </SectionTitle>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: COLORS.medGray, margin: "0 0 32px" }}>
            Send us your specifications, quantity or part number and we&rsquo;ll help identify suitable sourcing options.
          </p>
          <Button as="a" href="/#contact" variant="primary" style={{ margin: "0 auto", width: "fit-content" }}>
            Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} />
          </Button>
        </div>
      </Section>
    </>
  );
}

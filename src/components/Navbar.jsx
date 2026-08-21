import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { NAV_LINKS } from "../data/content";
import { listManufacturers } from "../lib/supabase/manufacturers";
import { listCategories } from "../lib/supabase/categories";
import { listProducts } from "../lib/supabase/products";
import { useQuoteList } from "../context/QuoteListContext";
import Icon from "./Icon";
import Button from "./Button";
import QuoteListPanel from "./QuoteListPanel";

const SEARCH_RESULT_LIMIT = 6;

// Nav items that get a hover mega-menu of live catalog data, keyed by label.
const MEGA_MENU_ITEMS = new Set(["Products", "Manufacturers"]);

function MegaMenu({ label, manufacturers, categories }) {
  if (label === "Manufacturers") {
    return (
      <div className="tm-mega-menu">
        {manufacturers.length > 0 ? (
          <div className="tm-mega-menu-grid">
            {manufacturers.map((m) => (
              <Link key={m.slug} to={`/manufacturers/${m.slug}`} className="tm-mega-menu-item">
                {m.name}
              </Link>
            ))}
          </div>
        ) : (
          <div className="tm-mega-menu-empty">No manufacturers published yet.</div>
        )}
        <Link to="/manufacturers" className="tm-mega-menu-viewall">
          View All Manufacturers <Icon type="arrow-right" size={14} color={COLORS.orange} />
        </Link>
      </div>
    );
  }

  return (
    <div className="tm-mega-menu">
      {categories.length > 0 ? (
        <div className="tm-mega-menu-grid">
          {categories.map((c) => (
            <Link key={c.slug} to={`/products?category=${c.slug}`} className="tm-mega-menu-item">
              {c.name}
            </Link>
          ))}
        </div>
      ) : (
        <div className="tm-mega-menu-empty">No categories published yet.</div>
      )}
      <Link to="/products" className="tm-mega-menu-viewall">
        View All Products <Icon type="arrow-right" size={14} color={COLORS.orange} />
      </Link>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // label of the mega-menu currently open, or null
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchBoxRef = useRef(null);

  const [quoteListOpen, setQuoteListOpen] = useState(false);
  const { items: quoteItems } = useQuoteList();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Fetched once, lazily — small lists (brands/categories), reused by both
  // the mega-menus and the mobile menu, so there's no need to load them per
  // nav item.
  useEffect(() => {
    listManufacturers({ status: "active" }).then(setManufacturers).catch(() => {});
    listCategories({ status: "active" }).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setSearchOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setSearchOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults(null); return; }
    let cancelled = false;
    setSearchLoading(true);
    listProducts({ search: searchQuery, status: "published" })
      .then((data) => { if (!cancelled) setSearchResults(data.slice(0, SEARCH_RESULT_LIMIT)); })
      .catch(() => { if (!cancelled) setSearchResults([]); })
      .finally(() => { if (!cancelled) setSearchLoading(false); });
    return () => { cancelled = true; };
  }, [searchQuery]);

  const closeMobileNav = () => setMobileNav(false);

  const goToFullSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchInput("");
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  return (
    <nav style={{
      position: "sticky", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgb(12, 20, 35)",
      backdropFilter: scrolled ? "blur(8px)" : "none",
      transition: "backdrop-filter 0.3s ease, border-color 0.3s ease",
      borderBottom: scrolled ? "1px solid rgba(255, 255, 255, 0.07)" : "1px solid rgba(255, 255, 255, 0)",
    }}>
      <div className="tm-navbar-inner" style={{ maxWidth: 1160, height: 97, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", cursor: "pointer", textDecoration: "none", marginRight: 32, flexShrink: 0 }}>
          <img className="tm-navbar-logo" src="/images/products/logo.png" alt="Trademarco Global" style={{ height: 56, width: "auto", display: "block" }} />
        </Link>

        {/* Desktop */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="desktop-nav">
          {NAV_LINKS.map((l) => {
            const hasMegaMenu = MEGA_MENU_ITEMS.has(l.label);
            const linkEl = l.href.includes("#") ? (
              <a href={l.href} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.15s", display: "flex", alignItems: "center", gap: 4 }}
                onMouseEnter={e => e.target.style.color = COLORS.white}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.8)"}>
                {l.label}
              </a>
            ) : (
              <Link to={l.href} style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.15s", display: "flex", alignItems: "center", gap: 4 }}
                onMouseEnter={e => e.target.style.color = COLORS.white}
                onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.8)"}>
                {l.label}
                {hasMegaMenu && <Icon type="chevron-down" size={12} color="rgba(255,255,255,0.5)" />}
              </Link>
            );

            if (!hasMegaMenu) return <div key={l.label}>{linkEl}</div>;

            return (
              <div
                key={l.label}
                style={{ position: "relative" }}
                onMouseEnter={() => setOpenMenu(l.label)}
                onMouseLeave={() => setOpenMenu((m) => (m === l.label ? null : m))}
              >
                {linkEl}
                {openMenu === l.label && (
                  <MegaMenu label={l.label} manufacturers={manufacturers} categories={categories} />
                )}
              </div>
            );
          })}

          {/* Search */}
          <div ref={searchBoxRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search products"
              aria-expanded={searchOpen}
              className="tm-navbar-icon-btn"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}
            >
              <Icon type="search" size={19} color="rgba(255,255,255,0.8)" />
            </button>
            {searchOpen && (
              <div className="tm-nav-search-panel">
                <form onSubmit={goToFullSearch} style={{ position: "relative" }}>
                  <input
                    type="search"
                    autoFocus
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search by product name or part number…"
                    aria-label="Search products"
                    className="tm-nav-search-input"
                  />
                </form>

                {searchQuery.length >= 2 && (
                  <div style={{ marginTop: 10 }}>
                    {searchLoading ? (
                      <div style={{ fontSize: 13, color: COLORS.medGray, padding: "12px 4px" }}>Searching…</div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {searchResults.map((p) => (
                            <Link
                              key={p.id}
                              to={`/manufacturers/${p.manufacturer?.slug}/${p.slug}`}
                              onClick={() => { setSearchOpen(false); setSearchInput(""); }}
                              className="tm-nav-search-result"
                            >
                              <div className="tm-nav-search-result-thumb">
                                {p.image_url ? <img src={p.image_url} alt="" /> : <Icon type="box" size={16} color={COLORS.borderGray} />}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {p.product_name}
                                </div>
                                <div style={{ fontSize: 11, color: COLORS.medGray }}>{p.manufacturer?.name} — {p.part_number}</div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        <button type="button" onClick={goToFullSearch} className="tm-nav-search-viewall">
                          View all results for &ldquo;{searchQuery}&rdquo;
                        </button>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: COLORS.medGray, padding: "12px 4px" }}>No products found.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quote list */}
          <button
            type="button"
            onClick={() => setQuoteListOpen(true)}
            aria-label={`Quote list${quoteItems.length ? `, ${quoteItems.length} items` : ""}`}
            className="tm-navbar-icon-btn"
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex" }}
          >
            <Icon type="clipboard" size={19} color="rgba(255,255,255,0.8)" />
            {quoteItems.length > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2, minWidth: 16, height: 16, borderRadius: 8,
                background: COLORS.orange, color: COLORS.white, fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
              }}>
                {quoteItems.length}
              </span>
            )}
          </button>

          <Button as="a" href="/#contact" variant="primary" style={{ padding: "10px 24px", fontSize: 13 }}>
            Request a Quote
          </Button>
        </div>

        {/* Mobile burger */}
        <div className="mobile-burger-row" style={{ alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => setQuoteListOpen(true)}
            aria-label={`Quote list${quoteItems.length ? `, ${quoteItems.length} items` : ""}`}
            style={{ position: "relative", background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
          >
            <Icon type="clipboard" size={22} color={COLORS.white} />
            {quoteItems.length > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2, minWidth: 15, height: 15, borderRadius: 8,
                background: COLORS.orange, color: COLORS.white, fontSize: 9, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
              }}>
                {quoteItems.length}
              </span>
            )}
          </button>
          <button onClick={() => setMobileNav(!mobileNav)} className="mobile-burger" style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <Icon type={mobileNav ? "close" : "menu"} size={28} color={COLORS.white} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileNav && (
        <div style={{ background: COLORS.navy, padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }} className="mobile-menu">
          <form onSubmit={(e) => { goToFullSearch(e); closeMobileNav(); }} style={{ position: "relative" }}>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="tm-nav-search-input tm-nav-search-input-mobile"
            />
          </form>
          {NAV_LINKS.map((l) => (
            l.href.includes("#") ? (
              <a key={l.label} href={l.href} onClick={closeMobileNav} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500, textDecoration: "none", padding: "4px 0" }}>
                {l.label}
              </a>
            ) : (
              <Link key={l.label} to={l.href} onClick={closeMobileNav} style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500, textDecoration: "none", padding: "4px 0" }}>
                {l.label}
              </Link>
            )
          ))}
          <Button as="a" href="/#contact" onClick={closeMobileNav} variant="primary" style={{ marginTop: 8, justifyContent: "center" }}>
            Request a Quote
          </Button>
        </div>
      )}

      <QuoteListPanel open={quoteListOpen} onClose={() => setQuoteListOpen(false)} />

      <style>{`
        .tm-navbar-icon-btn { border-radius: 6px; transition: background 0.15s ease; }
        .tm-navbar-icon-btn:hover { background: rgba(255,255,255,0.08); }
        .tm-navbar-icon-btn:focus-visible { outline: 2px solid ${COLORS.orange}; outline-offset: 2px; }

        .tm-mega-menu {
          /* flush against the nav link (no margin-top gap) — a gap here would
             sit outside the hoverable wrapper's box and close the menu the
             instant the cursor crosses it on the way down to an item */
          position: absolute; top: 100%; left: 50%; transform: translateX(-50%);
          padding-top: 14px; width: 320px; max-width: 80vw;
          background: ${COLORS.white}; background-clip: padding-box;
          border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.25);
          padding-left: 16px; padding-right: 16px; padding-bottom: 16px;
          z-index: 110;
          animation: tm-mega-fade 0.15s ease;
        }
        @keyframes tm-mega-fade { from { opacity: 0; transform: translateX(-50%) translateY(-4px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        .tm-mega-menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; max-height: 240px; overflow-y: auto; }
        .tm-mega-menu-item {
          display: block; padding: 8px 10px; font-size: 13px; font-weight: 600; color: ${COLORS.navy};
          text-decoration: none; border-radius: 4px; transition: background 0.15s ease;
        }
        .tm-mega-menu-item:hover { background: ${COLORS.lightGray}; color: ${COLORS.orange}; }
        .tm-mega-menu-empty { font-size: 13px; color: ${COLORS.medGray}; padding: 8px 10px; }
        .tm-mega-menu-viewall {
          display: flex; align-items: center; gap: 6px; margin-top: 12px; padding-top: 12px;
          border-top: 1px solid ${COLORS.borderGray}; font-size: 13px; font-weight: 700; color: ${COLORS.orange};
          text-decoration: none;
        }

        .tm-nav-search-panel {
          position: absolute; top: 100%; right: 0; margin-top: 14px; width: 380px; max-width: 85vw;
          background: ${COLORS.white}; border-radius: 8px; box-shadow: 0 12px 32px rgba(0,0,0,0.25);
          padding: 16px; z-index: 110;
        }
        .tm-nav-search-input {
          width: 100%; padding: 11px 14px; font-size: 14px; font-family: inherit;
          border: 1px solid ${COLORS.borderGray}; border-radius: 4px; outline: none; color: ${COLORS.darkGray};
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .tm-nav-search-input:focus { border-color: ${COLORS.navy}; box-shadow: 0 0 0 3px rgba(45,114,210,0.15); }
        .tm-nav-search-input-mobile { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.18); color: ${COLORS.white}; }
        .tm-nav-search-input-mobile:focus { border-color: ${COLORS.orange}; box-shadow: 0 0 0 3px rgba(232,124,48,0.25); }

        .tm-nav-search-result {
          display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 6px; text-decoration: none;
          transition: background 0.15s ease;
        }
        .tm-nav-search-result:hover { background: ${COLORS.lightGray}; }
        .tm-nav-search-result-thumb {
          width: 36px; height: 36px; flex-shrink: 0; border-radius: 4px; background: ${COLORS.lightGray};
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .tm-nav-search-result-thumb img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .tm-nav-search-viewall {
          display: block; width: 100%; text-align: center; margin-top: 10px; padding-top: 10px;
          border-top: 1px solid ${COLORS.borderGray}; font-size: 13px; font-weight: 700; color: ${COLORS.orange};
          background: none; border-left: none; border-right: none; border-bottom: none; cursor: pointer;
        }

        .mobile-burger-row { display: none; }

        @media (max-width: 1024px) {
          .tm-navbar-inner { height: 68px !important; }
          .tm-navbar-logo { height: 44px !important; }
        }
        @media (max-width: 768px) {
          .tm-navbar-inner { height: 60px !important; padding: 0 20px !important; }
          .tm-navbar-logo { height: 36px !important; }
          .mobile-burger-row { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}

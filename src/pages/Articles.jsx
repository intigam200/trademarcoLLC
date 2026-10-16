import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { listPublishedArticles } from "../lib/supabase/articles";
import { setSEO, setNoIndexSEO, setJSONLD, SITE_URL } from "../lib/seo";
import { Section } from "../components/Section";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

export default function Articles() {
  const [state, setState] = useState({ loading: true, articles: [] });

  useEffect(() => {
    listPublishedArticles()
      .then(({ articles }) => setState({ loading: false, articles }))
      .catch(() => setState({ loading: false, articles: [] }));
  }, []);

  useEffect(() => {
    if (state.loading) return;
    if (!state.articles.length) {
      // An empty listing is a thin page — keep it out of the index until
      // there is something on it (api/sitemap.js omits it too).
      setNoIndexSEO("Articles | Trademarco Global");
      setJSONLD(null);
      return;
    }
    setSEO({
      title: "Industrial Sourcing Articles & Guides | Trademarco Global",
      description: "Practical guides on selecting, replacing and sourcing industrial valves, instrumentation, automation and electrical equipment.",
      path: "/articles",
    });
    setJSONLD({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` },
      ],
    });
    return () => setJSONLD(null);
  }, [state]);

  return (
    <>
      <section style={{ background: COLORS.navy, backgroundImage: "radial-gradient(ellipse 700px 100% at 30% 0%, rgba(45,114,210,0.16), transparent 60%)" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "120px 24px 72px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 20 }}>Insights</div>
          <h1 style={{ fontSize: "clamp(30px, 4.2vw, 48px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.15, margin: 0, letterSpacing: "-0.02em" }}>Articles &amp; Guides</h1>
        </div>
      </section>

      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", gap: 8, fontSize: 13 }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>Articles</span>
        </div>
      </div>

      <Section bg={COLORS.lightGray}>
        {state.loading ? (
          <LoadingState label="Loading articles…" />
        ) : !state.articles.length ? (
          <EmptyState icon="document" title="No articles yet" description="Guides and articles will appear here once they're published." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {state.articles.map((a) => (
              <Link key={a.id} to={`/articles/${a.slug}`} style={{ display: "flex", flexDirection: "column", background: COLORS.white, border: `1px solid ${COLORS.borderGray}`, borderRadius: 10, overflow: "hidden", textDecoration: "none" }}>
                {a.hero_image_url && (
                  <img src={a.hero_image_url} alt={a.hero_image_alt || ""} loading="lazy" style={{ width: "100%", height: "auto", aspectRatio: "16 / 9", objectFit: "cover" }} />
                )}
                <div style={{ padding: 24 }}>
                  {a.published_at && (
                    <div style={{ fontSize: 12, color: COLORS.medGray, marginBottom: 8 }}>
                      {new Date(a.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                  )}
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: "0 0 10px", lineHeight: 1.35 }}>{a.title}</h2>
                  {a.excerpt && <p style={{ fontSize: 14, color: COLORS.medGray, lineHeight: 1.6, margin: 0 }}>{a.excerpt}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

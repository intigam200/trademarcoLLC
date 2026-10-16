import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { COLORS } from "../theme/colors";
import { getPublishedArticle } from "../lib/supabase/articles";
import { setSEO, setNoIndexSEO, setJSONLD } from "../lib/seo";
import { articleMeta } from "../lib/seoMeta";
import { articleJsonLd, ARTICLE_BODY_CSS } from "../lib/articlePresentation";
import { renderMarkdown } from "../lib/markdown";
import LoadingState from "../components/LoadingState";
import Button from "../components/Button";
import Icon from "../components/Icon";

export default function ArticleDetail() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading", article: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", article: null });
    getPublishedArticle(slug)
      .then((article) => { if (!cancelled) setState({ status: article ? "ready" : "not-found", article }); })
      .catch(() => { if (!cancelled) setState({ status: "not-found", article: null }); });
    return () => { cancelled = true; };
  }, [slug]);

  const { status, article } = state;
  const html = useMemo(() => (article ? renderMarkdown(article.body_md) : ""), [article]);

  useEffect(() => {
    if (status === "ready") {
      const meta = articleMeta(article);
      setSEO({ title: meta.title, description: meta.description, image: article.hero_image_url || undefined, type: "article", path: `/articles/${article.slug}` });
      setJSONLD(articleJsonLd(article));
    } else if (status === "not-found") {
      setNoIndexSEO("Article Not Found | Trademarco Global");
      setJSONLD(null);
    }
    return () => setJSONLD(null);
  }, [status, article]);

  if (status === "loading") return <div style={{ paddingTop: 120 }}><LoadingState label="Loading article…" minHeight={400} /></div>;
  if (status === "not-found") {
    return (
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "160px 24px 120px", textAlign: "center" }}>
        <h1 style={{ fontSize: 28, color: COLORS.navy }}>Article not found</h1>
        <p style={{ color: COLORS.medGray }}>It may have been moved or unpublished.</p>
        <Link to="/articles" style={{ color: COLORS.orange }}>All articles</Link>
      </div>
    );
  }

  return (
    <>
      <section style={{ background: COLORS.navy }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "120px 24px 56px" }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: COLORS.orange, marginBottom: 16 }}>Article</div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: COLORS.white, lineHeight: 1.2, margin: "0 0 16px", letterSpacing: "-0.02em" }}>{article.title}</h1>
          {article.published_at && (
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
              {new Date(article.published_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
        </div>
      </section>

      <div style={{ background: COLORS.white, borderBottom: `1px solid ${COLORS.borderGray}` }}>
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "16px 24px", display: "flex", gap: 8, fontSize: 13, flexWrap: "wrap" }}>
          <Link to="/" style={{ color: COLORS.medGray, textDecoration: "none" }}>Home</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <Link to="/articles" style={{ color: COLORS.medGray, textDecoration: "none" }}>Articles</Link>
          <span style={{ color: COLORS.borderGray }}>/</span>
          <span style={{ color: COLORS.navy, fontWeight: 600 }}>{article.title}</span>
        </div>
      </div>

      <article style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px 80px" }}>
        {article.hero_image_url && (
          <img src={article.hero_image_url} alt={article.hero_image_alt || ""} style={{ width: "100%", height: "auto", borderRadius: 10, marginBottom: 32 }} />
        )}
        {/* renderMarkdown escapes all input and emits only allow-listed tags. */}
        <div className="tm-article-body" dangerouslySetInnerHTML={{ __html: html }} />
        <div style={{ marginTop: 48, padding: 28, background: COLORS.lightGray, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, marginBottom: 4 }}>Need this part sourced?</div>
            <div style={{ fontSize: 14, color: COLORS.medGray }}>Send us the part numbers and quantities for a quotation.</div>
          </div>
          <Button as="a" href="/#contact" variant="primary">Request a Quote <Icon type="arrow-right" size={18} color={COLORS.white} /></Button>
        </div>
      </article>
      <style>{ARTICLE_BODY_CSS}</style>
    </>
  );
}

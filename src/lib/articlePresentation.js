import { COLORS } from "../theme/colors";
import { SITE_URL } from "./seo";
import { articleMeta } from "./seoMeta";

// BlogPosting + BreadcrumbList for an article page, and the typography for
// rendered article Markdown — shared by the public page and the admin preview.

export function articleJsonLd(article) {
  const url = `${SITE_URL}/articles/${article.slug}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: article.title,
      description: articleMeta(article).description || undefined,
      url,
      mainEntityOfPage: url,
      image: article.hero_image_url || undefined,
      datePublished: article.published_at || undefined,
      dateModified: article.updated_at || article.published_at || undefined,
      author: { "@type": "Organization", name: "Trademarco Global", url: SITE_URL },
      publisher: { "@type": "Organization", name: "Trademarco Global", logo: { "@type": "ImageObject", url: `${SITE_URL}/images/products/logo.png` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Articles", item: `${SITE_URL}/articles` },
        { "@type": "ListItem", position: 3, name: article.title },
      ],
    },
  ];
}

// Typography for rendered Markdown, shared with the admin preview.
export const ARTICLE_BODY_CSS = `
  .tm-article-body { font-size: 17px; line-height: 1.75; color: ${COLORS.darkGray}; }
  .tm-article-body h2 { font-size: 26px; line-height: 1.3; color: ${COLORS.navy}; margin: 40px 0 14px; }
  .tm-article-body h3 { font-size: 20px; line-height: 1.35; color: ${COLORS.navy}; margin: 30px 0 10px; }
  .tm-article-body h4 { font-size: 17px; color: ${COLORS.navy}; margin: 24px 0 8px; }
  .tm-article-body p { margin: 0 0 18px; }
  .tm-article-body ul, .tm-article-body ol { margin: 0 0 18px; padding-left: 24px; }
  .tm-article-body li { margin-bottom: 6px; }
  .tm-article-body a { color: ${COLORS.orange}; }
  .tm-article-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0 18px; }
  .tm-article-body blockquote { margin: 0 0 18px; padding: 12px 18px; border-left: 3px solid ${COLORS.orange}; background: ${COLORS.lightGray}; }
  .tm-article-body blockquote p { margin: 0; }
  .tm-article-body code { background: ${COLORS.lightGray}; padding: 1px 6px; border-radius: 4px; font-size: 0.92em; }
  .tm-article-body hr { border: none; border-top: 1px solid ${COLORS.borderGray}; margin: 32px 0; }
`;


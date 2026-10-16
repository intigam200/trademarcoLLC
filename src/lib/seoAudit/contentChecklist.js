// Content quality gate for articles. Two kinds of check:
//  - automated: computed from the article and the real catalogue, and
//  - human: judgements software can't make honestly (is this original, are the
//    facts right). These stay "not_checked" until a reviewer signs them off.
// States: pass | warning | fail | not_checked.
//
// The score is internal bookkeeping only — it is not a Google ranking score
// and passing every check does not guarantee rankings.

import { analyzeMarkdown } from "../markdown.js";
import { articleMeta, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX } from "../seoMeta.js";
import { findBrokenInternalLinks, productUrl } from "./linking.js";

export const GROUPS = {
  relevance: "Relevance & originality",
  facts: "Factual accuracy",
  onpage: "On-page SEO",
  commercial: "Commercial relevance",
};

export const HUMAN_CHECKS = [
  { id: "real_question", group: "relevance", label: "Answers a real question from TradeMarco's buyers (procurement, engineering, maintenance)" },
  { id: "original_value", group: "relevance", label: "Adds specific, original value — analysis, practical examples or verified detail — beyond what the product pages already say" },
  { id: "facts_verified", group: "facts", label: "Every technical claim, model number and figure has been checked against the recorded sources" },
  { id: "claims_supported", group: "facts", label: "No claim the business can't substantiate (authorisation, certification, stock, lead times, prices)" },
  { id: "supports_decision", group: "commercial", label: "Helps a buyer make a real decision, and the call to action fits the search intent" },
];

// Wording that usually signals a claim needing evidence, or one this business
// can't make (it is an independent sourcing company, not an authorised
// distributor, and publishes no prices or stock levels).
const RISKY_PHRASES = [
  "authorized distributor", "authorised distributor", "official distributor", "official partner",
  "certified", "guaranteed", "guarantee", "in stock", "lowest price", "best price", "cheapest",
  "100%", "never fails", "always", "the best", "#1", "number one", "fastest delivery", "same-day",
];

const SEARCH_ENGINE_STOPWORDS = new Set(["a", "an", "the", "for", "of", "to", "in", "on", "and", "or", "vs", "with", "how", "what", "is", "are"]);

function words(s) {
  return String(s ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function jaccard(a, b) {
  const A = new Set(words(a).filter((w) => !SEARCH_ENGINE_STOPWORDS.has(w)));
  const B = new Set(words(b).filter((w) => !SEARCH_ENGINE_STOPWORDS.has(w)));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

function containsAll(haystack, needle) {
  const h = new Set(words(haystack));
  const n = words(needle).filter((w) => !SEARCH_ENGINE_STOPWORDS.has(w));
  return n.length > 0 && n.every((w) => h.has(w));
}

// Tokens that look like model/part numbers: letters and digits mixed, 4+ chars.
export function extractPartNumberLike(text) {
  const found = new Set();
  for (const m of String(text ?? "").matchAll(/\b(?=[A-Za-z0-9-]*\d)(?=[A-Za-z0-9-]*[A-Za-z])[A-Za-z0-9][A-Za-z0-9-]{3,}\b/g)) {
    found.add(m[0]);
  }
  return [...found];
}

export function evaluateArticle(article, ctx = {}) {
  const { articles = [], products = [], manufacturers = [], categories = [] } = ctx;
  const body = article.body_md || "";
  const a = analyzeMarkdown(body);
  const meta = articleMeta(article);
  const query = (article.primary_query || "").trim();
  const others = articles.filter((o) => o.id !== article.id);
  const checks = [];
  const add = (id, group, label, state, detail) => checks.push({ id, group, label, state, detail, kind: "automated" });

  // ── Relevance & originality ────────────────────────────────────────────
  add("primary_query", "relevance", "Primary search query defined",
    query ? "pass" : "fail", query ? `“${query}”` : "Set the query this article is meant to answer.");

  const sameQuery = query ? others.filter((o) => (o.primary_query || "").trim().toLowerCase() === query.toLowerCase()) : [];
  const similar = others.filter((o) => jaccard(o.title, article.title) >= 0.6);
  add("overlap_articles", "relevance", "No overlap with existing articles",
    sameQuery.length ? "fail" : similar.length ? "warning" : "pass",
    sameQuery.length ? `Same primary query as: ${sameQuery.map((o) => o.title).join("; ")}. Merge or retarget — two pages competing for one query split its signals.`
      : similar.length ? `Similar title to: ${similar.map((o) => o.title).join("; ")}. Check they target different intents.`
        : `Compared with ${others.length} other article${others.length === 1 ? "" : "s"}.`);

  const productClash = query ? products.find((p) => p.status === "published" && (words(p.part_number).join(" ") === words(query).join(" ") || words(`${p.manufacturer?.name ?? ""} ${p.part_number}`).join(" ") === words(query).join(" "))) : null;
  add("overlap_products", "relevance", "Doesn't compete with a product page",
    productClash ? "warning" : "pass",
    productClash ? `The query matches the product page ${productUrl(productClash)}, which already targets it. An article should answer a broader question and link to that page.` : "No product page targets this exact query.");

  // ── Factual accuracy ───────────────────────────────────────────────────
  const sources = Array.isArray(article.sources) ? article.sources.filter((s) => s && s.url) : [];
  add("sources", "facts", "Sources recorded for review",
    sources.length ? "pass" : "warning",
    sources.length ? `${sources.length} source${sources.length === 1 ? "" : "s"} recorded.` : "No source URLs recorded. Technical claims should be traceable to manufacturer documentation or standards.");

  const known = new Set(products.flatMap((p) => [p.part_number, ...(p.alternative_part_numbers || [])]).filter(Boolean).map((s) => s.toLowerCase()));
  const mentioned = extractPartNumberLike(`${article.title}\n${body}`);
  const unknown = mentioned.filter((t) => !known.has(t.toLowerCase()) && /\d/.test(t) && /[A-Za-z]/.test(t));
  add("part_numbers", "facts", "Model numbers match the catalogue",
    unknown.length ? "warning" : "pass",
    unknown.length ? `Not in the catalogue — verify against the source: ${unknown.slice(0, 12).join(", ")}${unknown.length > 12 ? "…" : ""}` : mentioned.length ? `${mentioned.length} model number${mentioned.length === 1 ? "" : "s"} found in the catalogue.` : "No model numbers mentioned.");

  // Bracketed notes left over from a brief-generated draft.
  const placeholders = [...body.matchAll(/\[(Opening paragraph|Write this section|Call to action)[^\]]*\]/g)].length
    + (body.includes("Draft created from a template-based brief") ? 1 : 0);
  add("placeholders", "facts", "No unfinished template notes",
    placeholders ? "fail" : "pass",
    placeholders ? `${placeholders} bracketed draft note(s) still in the text.` : "None left.");

  const lower = `${article.title} ${body}`.toLowerCase();
  const risky = RISKY_PHRASES.filter((p) => lower.includes(p));
  add("risky_claims", "facts", "No unsupported-claim wording",
    risky.length ? "warning" : "pass",
    risky.length ? `Review: ${risky.map((r) => `“${r}”`).join(", ")} — keep only if a source supports it.` : "No flagged wording found.");

  // ── On-page SEO ────────────────────────────────────────────────────────
  const title = (article.title || "").trim();
  const dupTitle = others.find((o) => (o.title || "").trim().toLowerCase() === title.toLowerCase());
  add("title", "onpage", "Unique, descriptive title",
    !title ? "fail" : dupTitle ? "fail" : meta.title.length > TITLE_MAX ? "warning" : "pass",
    !title ? "Add a title." : dupTitle ? `Another article already uses this title.` : meta.title.length > TITLE_MAX ? `Search title is ${meta.title.length} characters; about ${TITLE_MAX} show before truncation.` : `${meta.title.length} characters.`);

  const desc = meta.description;
  add("meta_description", "onpage", "Useful meta description",
    !desc ? "fail" : desc.length < DESCRIPTION_MIN || desc.length > DESCRIPTION_MAX ? "warning" : "pass",
    !desc ? "Add a meta description or an excerpt." : `${desc.length} characters (aim for ${DESCRIPTION_MIN}–${DESCRIPTION_MAX}).`);

  const h1InBody = a.headings.filter((h) => h.level === 1);
  add("h1", "onpage", "Single H1",
    !title ? "fail" : h1InBody.length ? "warning" : "pass",
    h1InBody.length ? `The title is the page's H1; the body also has ${h1InBody.length} level-1 heading(s). Use ## instead.` : "The article title is the only H1.");

  let skipped = null;
  let prev = 1;
  for (const h of a.headings) {
    if (h.level > prev + 1) { skipped = h; break; }
    prev = h.level;
  }
  const h2s = a.headings.filter((h) => h.level === 2).length;
  add("heading_structure", "onpage", "Logical heading hierarchy",
    skipped ? "warning" : h2s === 0 && a.wordCount > 300 ? "warning" : "pass",
    skipped ? `“${skipped.text}” jumps to H${skipped.level}; headings shouldn't skip levels.` : h2s === 0 && a.wordCount > 300 ? "Longer articles are easier to scan with H2 sections." : `${h2s} H2 section${h2s === 1 ? "" : "s"}.`);

  if (query) {
    const inTitle = containsAll(title, query);
    const inIntro = containsAll(a.firstParagraph, query);
    const qWords = words(query).filter((w) => !SEARCH_ENGINE_STOPWORDS.has(w));
    const bodyWords = words(a.plainText);
    const hits = qWords.length ? Math.min(...qWords.map((w) => bodyWords.filter((b) => b === w).length)) : 0;
    // Density says nothing about a short text — two mentions in 30 words is
    // natural — so it is only judged once there is a body of some length.
    const density = bodyWords.length >= 150 ? (hits * qWords.length) / bodyWords.length : 0;
    add("query_usage", "onpage", "Primary query used naturally",
      density > 0.04 ? "warning" : inTitle && inIntro ? "pass" : "warning",
      density > 0.04 ? `Query terms make up ${(density * 100).toFixed(1)}% of the text — reads as keyword stuffing.`
        : `${inTitle ? "In" : "Not in"} the title; ${inIntro ? "in" : "not in"} the opening paragraph.`);
  } else {
    add("query_usage", "onpage", "Primary query used naturally", "not_checked", "Set a primary query first.");
  }

  const internal = a.links.filter((l) => l.internal);
  const broken = findBrokenInternalLinks(internal.map((l) => l.href), { products, manufacturers, categories, articles });
  add("internal_links", "onpage", "Internal links resolve",
    broken.length ? "fail" : internal.length ? "pass" : "warning",
    broken.length ? `Links to pages that don't exist: ${broken.join(", ")}` : internal.length ? `${internal.length} internal link${internal.length === 1 ? "" : "s"}, all valid.` : "No internal links yet.");

  const noAlt = a.images.filter((img) => !img.alt);
  const heroMissingAlt = article.hero_image_url && !(article.hero_image_alt || "").trim();
  add("image_alt", "onpage", "Images have descriptive alt text",
    noAlt.length || heroMissingAlt ? "fail" : "pass",
    noAlt.length || heroMissingAlt ? `${noAlt.length + (heroMissingAlt ? 1 : 0)} image(s) without alt text.` : a.images.length || article.hero_image_url ? "All images described." : "No images.");

  add("slug", "onpage", "Clean, unique URL",
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(article.slug || "") ? "fail" : others.some((o) => o.slug === article.slug) ? "fail" : "pass",
    !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(article.slug || "") ? "Use lowercase words separated by hyphens." : others.some((o) => o.slug === article.slug) ? "Another article uses this URL." : `/articles/${article.slug}`);

  add("canonical", "onpage", "Canonical URL", "pass", `Self-referencing canonical: https://www.trademarco.com/articles/${article.slug || "…"} (set by the page template).`);
  add("indexable", "onpage", "Indexable once published", "pass", "Published articles are indexable and listed in sitemap.xml; drafts are not public.");

  // ── Commercial relevance ───────────────────────────────────────────────
  const catalogLinks = internal.filter((l) => /^(https?:\/\/(www\.)?trademarco\.com)?\/(manufacturers|products)/i.test(l.href));
  add("catalog_link", "commercial", "Links to a real product, brand or category",
    catalogLinks.length ? "pass" : "warning",
    catalogLinks.length ? `${catalogLinks.length} catalogue link${catalogLinks.length === 1 ? "" : "s"}.` : "Readers have no path from the article to what you supply.");
  const cta = a.links.some((l) => /#contact|\/manufacturers\/[^/]+\/[^/]+/.test(l.href));
  add("cta", "commercial", "Relevant call to action",
    cta ? "pass" : "warning",
    cta ? "Links to a quote request or product page." : "Add a call to action — e.g. a link to request a quotation (/#contact) or to the relevant product.");

  // ── Human sign-offs ────────────────────────────────────────────────────
  const review = article.review || {};
  for (const h of HUMAN_CHECKS) {
    const signed = review[h.id];
    checks.push({ ...h, kind: "human", state: signed ? "pass" : "not_checked", detail: signed ? `Confirmed${signed.by ? ` by ${signed.by}` : ""}${signed.at ? ` on ${new Date(signed.at).toLocaleDateString()}` : ""}.` : "Needs a reviewer's confirmation." });
  }

  const automated = checks.filter((c) => c.kind === "automated" && c.state !== "not_checked");
  const points = automated.reduce((sum, c) => sum + (c.state === "pass" ? 1 : c.state === "warning" ? 0.5 : 0), 0);
  const fails = checks.filter((c) => c.state === "fail");
  const unsigned = checks.filter((c) => c.kind === "human" && c.state !== "pass");
  return {
    checks,
    score: automated.length ? Math.round((points / automated.length) * 100) : 0,
    scoreExplanation: `Automated checks only: pass = 1, warning = ½, fail = 0, out of ${automated.length}. Human checks are not scored. This is an internal readiness measure, not a Google ranking score.`,
    canPublish: fails.length === 0 && unsigned.length === 0,
    blockers: [...fails.map((c) => c.label), ...unsigned.map((c) => `Reviewer sign-off: ${c.label}`)],
    analysis: a,
  };
}

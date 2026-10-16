// Detects on-page SEO issues in the catalogue from database records alone —
// no crawling. Works on the *effective* values (src/lib/seoMeta.js), i.e. what
// the site actually serves, so a product without a custom SEO title is judged
// on the title it really gets rather than flagged as "missing".
//
// Every issue is a detected fact about the data. Severity reflects likely
// impact on how the page appears in search, not a prediction of rankings.

import { productMeta, manufacturerMeta, categoryMeta, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX } from "../seoMeta.js";

export const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 };

// id → definition. `fix` is a recommendation, kept separate from the fact.
export const PRODUCT_CHECKS = {
  brand_inactive: {
    severity: "high",
    label: "Published, but its brand isn't active",
    impact: "Visitors and search engines get “not found”: a product page only exists while its manufacturer is active. It is also missing from the sitemap.",
    fix: "Set the manufacturer back to Active, or move these products to draft if the brand was retired on purpose.",
  },
  title_duplicate: {
    severity: "high",
    label: "Duplicate title",
    impact: "Google may treat pages with the same title as duplicates and show only one of them.",
    fix: "Give each product a title that includes its manufacturer and part number.",
  },
  description_duplicate: {
    severity: "high",
    label: "Duplicate meta description",
    impact: "Identical descriptions make it harder for Google to tell the pages apart, and it will usually rewrite the snippet.",
    fix: "Write a description specific to this part: what it is, its series, and what it is used for.",
  },
  description_template: {
    severity: "medium",
    label: "Generic meta description",
    impact: "No custom or product description exists, so the page serves a generic template line.",
    fix: "Add a short description to the product, or a custom meta description.",
  },
  content_thin: {
    severity: "medium",
    label: "Incomplete product description",
    impact: "Very little unique text on the page gives searchers and search engines little reason to choose it.",
    fix: "Add a long description from the manufacturer's documentation: function, key features, typical applications.",
  },
  no_image: {
    severity: "medium",
    label: "No product image",
    impact: "Pages without an image are less useful to buyers and cannot appear in image results.",
    fix: "Upload a product photo or the manufacturer's official image.",
  },
  title_long: {
    severity: "low",
    label: "Title likely truncated",
    impact: `Titles over about ${TITLE_MAX} characters are usually cut off in results.`,
    fix: "Shorten the title, keeping the manufacturer and part number at the start.",
  },
  description_length: {
    severity: "low",
    label: "Meta description length",
    impact: `Descriptions under ${DESCRIPTION_MIN} or over ${DESCRIPTION_MAX} characters tend to be rewritten or truncated.`,
    fix: `Aim for roughly ${DESCRIPTION_MIN}–${DESCRIPTION_MAX} characters.`,
  },
  alt_default: {
    severity: "low",
    label: "Default image alt text",
    impact: "The image falls back to the product name as alt text. Fine, but a description of what the photo shows is more useful.",
    fix: "Describe the photo, e.g. \"Fisher 8580 butterfly valve with actuator, side view\".",
  },
  no_related: {
    severity: "low",
    label: "No related products",
    impact: "The page only links to its neighbours by part number; related-product links help buyers and crawlers find alternatives.",
    fix: "Add related products from the same series or family (see the suggestions in the editor).",
  },
};

function countBy(values) {
  const map = new Map();
  for (const v of values) {
    const key = v.toLowerCase();
    map.set(key, (map.get(key) || 0) + 1);
  }
  return map;
}

// products: rows with manufacturer { name } and category { name } joined.
// relatedCounts: Map(productId → number of related products), optional.
// altSupported: whether products.image_alt exists (migration applied).
export function auditProducts(products, { relatedCounts = null, altSupported = false } = {}) {
  const published = products.filter((p) => p.status === "published");
  const metas = new Map(products.map((p) => [p.id, productMeta(p)]));
  // Duplicates only matter among pages the public can actually reach.
  const titleCounts = countBy(published.map((p) => metas.get(p.id).title));
  const descCounts = countBy(published.map((p) => metas.get(p.id).description));

  const rows = products.map((p) => {
    const meta = metas.get(p.id);
    const issues = [];
    const isLive = p.status === "published";

    // Only judged when the manufacturer's status was loaded (the admin reads it).
    if (isLive && p.manufacturer?.status && p.manufacturer.status !== "active") issues.push("brand_inactive");
    if (isLive && titleCounts.get(meta.title.toLowerCase()) > 1) issues.push("title_duplicate");
    if (isLive && descCounts.get(meta.description.toLowerCase()) > 1) issues.push("description_duplicate");
    if (meta.descriptionSource === "template") issues.push("description_template");
    const textLength = (p.short_description || "").trim().length + (p.long_description || "").trim().length;
    if (!(p.long_description || "").trim() && textLength < 120) issues.push("content_thin");
    if (!p.image_url) issues.push("no_image");
    if (meta.title.length > TITLE_MAX) issues.push("title_long");
    if (meta.description.length < DESCRIPTION_MIN || meta.description.length > DESCRIPTION_MAX) issues.push("description_length");
    if (altSupported && p.image_url && meta.imageAltSource === "template") issues.push("alt_default");
    if (relatedCounts && !relatedCounts.get(p.id)) issues.push("no_related");

    issues.sort((a, b) => SEVERITY_ORDER[PRODUCT_CHECKS[a].severity] - SEVERITY_ORDER[PRODUCT_CHECKS[b].severity]);
    const worst = issues.length ? PRODUCT_CHECKS[issues[0]].severity : null;
    return { product: p, meta, issues, worst, titleDuplicates: titleCounts.get(meta.title.toLowerCase()) || 0, descriptionDuplicates: descCounts.get(meta.description.toLowerCase()) || 0 };
  });

  const counts = Object.fromEntries(Object.keys(PRODUCT_CHECKS).map((id) => [id, rows.filter((r) => r.issues.includes(id)).length]));
  return { rows, counts };
}

export const PAGE_CHECKS = {
  no_products: {
    severity: "high",
    label: "No published products",
    impact: "The page is in the sitemap but lists nothing — a thin page that can weigh on how Google assesses the site.",
    fix: "Publish products for it, or set it to draft until there is inventory to show.",
  },
  title_duplicate: {
    severity: "high",
    label: "Duplicate title",
    impact: "Two pages share a title, so Google may pick only one of them.",
    fix: "Make the title specific to this brand or category.",
  },
  description_template: {
    severity: "medium",
    label: "No introductory content",
    impact: "No description exists, so the page serves a generic template sentence and has no intro text.",
    fix: "Write 2–3 sentences on what this brand or category covers and what you supply from it.",
  },
  intro_short: {
    severity: "medium",
    label: "Very short introduction",
    impact: "A one-line intro gives the page little unique content beyond the product list.",
    fix: "Expand the description with the product lines and applications you actually supply.",
  },
  description_length: {
    severity: "low",
    label: "Meta description length",
    impact: `Descriptions under ${DESCRIPTION_MIN} or over ${DESCRIPTION_MAX} characters tend to be rewritten or truncated.`,
    fix: "Set a custom meta description of roughly 70–160 characters.",
  },
  title_long: {
    severity: "low",
    label: "Title likely truncated",
    impact: `Titles over about ${TITLE_MAX} characters are usually cut off in results.`,
    fix: "Set a shorter custom SEO title.",
  },
  no_logo: {
    severity: "low",
    label: "No logo",
    impact: "Brand cards and the brand page show a placeholder instead of the manufacturer's mark.",
    fix: "Upload the logo in Manufacturers.",
  },
};

// pages: [{ kind: "manufacturer" | "category", record, productCount }]
export function auditPages(pages) {
  const metas = pages.map((p) => (p.kind === "manufacturer" ? manufacturerMeta(p.record) : categoryMeta(p.record)));
  const live = pages.map((p) => p.record.status === "active");
  const titleCounts = countBy(metas.filter((_, i) => live[i]).map((m) => m.title));

  return pages.map((page, i) => {
    const meta = metas[i];
    const issues = [];
    const intro = page.kind === "manufacturer"
      ? (page.record.description || "")
      : (page.record.full_description || page.record.description || "");
    if (live[i] && page.productCount === 0) issues.push("no_products");
    if (live[i] && titleCounts.get(meta.title.toLowerCase()) > 1) issues.push("title_duplicate");
    if (!intro.trim()) issues.push("description_template");
    else if (intro.trim().length < 100) issues.push("intro_short");
    if (meta.description.length < DESCRIPTION_MIN || meta.description.length > DESCRIPTION_MAX) issues.push("description_length");
    if (meta.title.length > TITLE_MAX) issues.push("title_long");
    if (page.kind === "manufacturer" && !page.record.logo_url) issues.push("no_logo");
    issues.sort((a, b) => SEVERITY_ORDER[PAGE_CHECKS[a].severity] - SEVERITY_ORDER[PAGE_CHECKS[b].severity]);
    return { ...page, meta, issues, worst: issues.length ? PAGE_CHECKS[issues[0]].severity : null };
  });
}

// Brand × category combinations with enough real inventory that a dedicated
// landing page could serve a distinct search ("Flowserve control valves").
// Only suggests; the overlap note states what existing page already covers it.
export function landingPageCandidates(products, { minProducts = 12 } = {}) {
  const groups = new Map();
  for (const p of products) {
    if (p.status !== "published" || !p.manufacturer || !p.category) continue;
    const key = `${p.manufacturer.slug}|${p.category.slug}`;
    if (!groups.has(key)) groups.set(key, { manufacturer: p.manufacturer, category: p.category, products: [] });
    groups.get(key).products.push(p);
  }
  const brandTotals = countBy(products.filter((p) => p.status === "published" && p.manufacturer).map((p) => p.manufacturer.slug));
  return [...groups.values()]
    .filter((g) => g.products.length >= minProducts)
    .map((g) => ({
      ...g,
      count: g.products.length,
      brandTotal: brandTotals.get(g.manufacturer.slug.toLowerCase()) || g.products.length,
    }))
    .sort((a, b) => b.count - a.count);
}

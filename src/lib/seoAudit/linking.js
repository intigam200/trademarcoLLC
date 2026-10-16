// Internal Linking Assistant. Suggests links from relationships that exist in
// the data — same series, shared part-number family, same brand and category,
// or an article actually mentioning a product or brand — and says which one
// applies. Never suggests a link without a stated reason, and never one that
// already exists.

export function productUrl(p) {
  return `/manufacturers/${p.manufacturer?.slug}/${p.slug}`;
}

function norm(s) {
  return String(s ?? "").trim().toLowerCase();
}

// Leading alphanumeric run of a part number: "3051CD2A…" → "3051", "AXW900G" →
// "axw900". Products sharing it usually belong to one family.
export function partFamily(partNumber) {
  const m = norm(partNumber).match(/^[a-z]*\d+/);
  return m && m[0].length >= 3 ? m[0] : null;
}

// Shared leading characters of two part numbers, if long enough and containing
// a digit to mean anything: TU810V1 / TU811V1 → "tu81", 3051CD / 3051S →
// "3051", but 8580 / 8532 → null and AXW900 / AXW400 → null.
export function sharedPartPrefix(a, b) {
  const x = norm(a);
  const y = norm(b);
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  const prefix = x.slice(0, i).replace(/[-\s/]+$/, "");
  return prefix.length >= 4 && /\d/.test(prefix) ? prefix : null;
}

// Candidates for product → related product links, best first.
export function suggestRelatedProducts(product, allProducts, { existingIds = [], limit = 6 } = {}) {
  const existing = new Set(existingIds);
  const series = norm(product.series);
  const out = [];
  for (const other of allProducts) {
    if (other.id === product.id || existing.has(other.id) || other.status !== "published") continue;
    if (other.manufacturer_id !== product.manufacturer_id) continue;
    let score = 0;
    const reasons = [];
    if (series && norm(other.series) === series) { score += 3; reasons.push(`same series (${product.series})`); }
    const prefix = sharedPartPrefix(product.part_number, other.part_number);
    if (prefix) { score += 2; reasons.push(`same part-number family (${prefix.toUpperCase()}…)`); }
    if (other.category_id === product.category_id) { score += 1; reasons.push("same category"); }
    // Brand + category alone is too weak to recommend on its own.
    if (score < 2) continue;
    out.push({ product: other, score, reason: reasons.join(", ") });
  }
  return out.sort((a, b) => b.score - a.score || norm(a.product.part_number).localeCompare(norm(b.product.part_number))).slice(0, limit);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Article → catalogue links: products whose part number appears in the text,
// and brands/categories named in it, that the article doesn't link to yet.
export function suggestArticleLinks(articleText, linkedHrefs, { products = [], manufacturers = [], categories = [] } = {}) {
  const text = String(articleText ?? "");
  const linked = new Set(linkedHrefs.map((h) => h.replace(/^https?:\/\/(www\.)?trademarco\.com/i, "")));
  const out = [];
  const seen = new Set();
  const add = (href, anchor, reason, kind) => {
    if (linked.has(href) || seen.has(href)) return;
    seen.add(href);
    out.push({ href, anchor, reason, kind });
  };

  for (const p of products) {
    if (p.status !== "published" || !p.part_number || p.part_number.length < 3) continue;
    const re = new RegExp(`(^|[^A-Za-z0-9])${escapeRegExp(p.part_number)}(?![A-Za-z0-9])`, "i");
    if (re.test(text)) add(productUrl(p), `${p.manufacturer?.name ?? ""} ${p.part_number}`.trim(), `Article mentions part number ${p.part_number}`, "product");
  }
  for (const m of manufacturers) {
    if (m.status !== "active" || m.name.length < 3) continue;
    if (new RegExp(`\\b${escapeRegExp(m.name)}\\b`, "i").test(text)) add(`/manufacturers/${m.slug}`, `${m.name} products`, `Article mentions ${m.name}`, "manufacturer");
  }
  for (const c of categories) {
    if (c.status !== "active") continue;
    if (new RegExp(`\\b${escapeRegExp(c.name)}\\b`, "i").test(text)) add(`/products?category=${c.slug}`, c.name, `Article mentions ${c.name}`, "category");
  }
  return out;
}

// Which internal hrefs in an article do not resolve to a real catalogue page.
export function findBrokenInternalLinks(hrefs, { products = [], manufacturers = [], categories = [], articles = [] } = {}) {
  const valid = new Set(["/", "/products", "/manufacturers", "/industries", "/company", "/articles", "/privacy-policy", "/terms-of-service", "/cookie-policy"]);
  products.filter((p) => p.status === "published").forEach((p) => valid.add(productUrl(p)));
  manufacturers.filter((m) => m.status === "active").forEach((m) => valid.add(`/manufacturers/${m.slug}`));
  categories.filter((c) => c.status === "active").forEach((c) => valid.add(`/products?category=${c.slug}`));
  articles.filter((a) => a.status === "published").forEach((a) => valid.add(`/articles/${a.slug}`));
  return hrefs
    .map((h) => h.replace(/^https?:\/\/(www\.)?trademarco\.com/i, "") || "/")
    .filter((h) => {
      const path = h.split("#")[0];
      if (!path || path.startsWith("mailto:")) return false;
      if (h === "/#contact" || path === "/") return false;
      return !valid.has(path.replace(/\/$/, "") || "/");
    });
}

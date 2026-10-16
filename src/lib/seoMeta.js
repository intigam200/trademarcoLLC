// The one place page titles, meta descriptions and H1s are derived. Used by
// the React pages, by api/render.js (what crawlers receive) and by the SEO
// Growth Center's audits — so the admin always reports exactly what the site
// serves. Pure functions: no DOM, no import.meta, safe to import server-side.
//
// Each result says where its values came from ("custom" = an SEO field the
// admin set, "content" = an existing description, "template" = generated
// fallback). The audit uses that to tell a deliberate value from a default.

export const ORG_NAME = "Trademarco Global";

// Lengths Google typically shows before truncating, in characters. Google
// actually truncates by pixel width, so these are guidance, not hard limits.
export const TITLE_MAX = 60;
export const DESCRIPTION_MIN = 70;
export const DESCRIPTION_MAX = 160;

function clean(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function pick(...candidates) {
  for (const [value, source] of candidates) {
    const v = clean(value);
    if (v) return { value: v, source };
  }
  return { value: "", source: "missing" };
}

export function productLabel(product, manufacturerName = product?.manufacturer?.name) {
  return [clean(manufacturerName), clean(product?.part_number), clean(product?.product_name)].filter(Boolean).join(" ");
}

export function productMeta(product, manufacturerName = product?.manufacturer?.name) {
  const label = productLabel(product, manufacturerName);
  const title = pick([product?.seo_title, "custom"], [`${label} | ${ORG_NAME}`, "template"]);
  const description = pick(
    [product?.seo_description, "custom"],
    [product?.short_description, "content"],
    [`Request a quote for ${label} from ${ORG_NAME}.`, "template"],
  );
  return {
    title: title.value,
    titleSource: title.source,
    description: description.value,
    descriptionSource: description.source,
    h1: clean(product?.product_name),
    imageAlt: clean(product?.image_alt) || label,
    imageAltSource: clean(product?.image_alt) ? "custom" : "template",
  };
}

export function manufacturerMeta(manufacturer) {
  const name = clean(manufacturer?.name);
  const title = pick([manufacturer?.seo_title, "custom"], [`${name} Industrial Products | ${ORG_NAME}`, "template"]);
  const description = pick(
    [manufacturer?.seo_description, "custom"],
    [manufacturer?.description, "content"],
    [`Explore ${name} industrial products supplied worldwide by ${ORG_NAME}.`, "template"],
  );
  return { title: title.value, titleSource: title.source, description: description.value, descriptionSource: description.source, h1: name };
}

export function categoryMeta(category) {
  const name = clean(category?.name);
  const title = pick([category?.seo_title, "custom"], [`${name} | Industrial Products | ${ORG_NAME}`, "template"]);
  const description = pick(
    [category?.seo_description, "custom"],
    [category?.full_description, "content"],
    [category?.description, "content"],
    [`Browse ${name} industrial products and equipment supplied by ${ORG_NAME}. Request a quotation today.`, "template"],
  );
  return { title: title.value, titleSource: title.source, description: description.value, descriptionSource: description.source, h1: name };
}

export function articleMeta(article) {
  const title = pick([article?.meta_title, "custom"], [`${clean(article?.title)} | ${ORG_NAME}`, "template"]);
  const description = pick([article?.meta_description, "custom"], [article?.excerpt, "content"]);
  return { title: title.value, titleSource: title.source, description: description.value, descriptionSource: description.source, h1: clean(article?.title) };
}

// Trims at a word boundary so a suggested value never ends mid-word.
export function truncateAtWord(text, max) {
  const t = clean(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
}

// trademarco.com's DNS now points at this Vercel project (www.trademarco.com
// is the canonical host — the bare domain redirects to it). VITE_SITE_URL
// remains available as an override for staging/preview use.
export const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.trademarco.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/products/logo.png`;

function setMeta(attr, key, content) {
  if (!content) return;
  let tag = document.querySelector(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(href) {
  if (!href) return;
  let tag = document.querySelector('link[rel="canonical"]');
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

// path: pathname (+ optional query) to canonicalize to, e.g. "/manufacturers/abb".
// Defaults to the current URL's path+search. Pass it explicitly whenever the
// route is known ahead of the browser location (avoids a stale value on the
// first render before the router settles).
export function setSEO({ title, description, image, type = "website", path } = {}) {
  if (title) document.title = title;
  setMeta("name", "description", description);

  const canonicalPath = path ?? (typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/");
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;
  setCanonical(canonicalUrl);

  const resolvedImage = image || DEFAULT_OG_IMAGE;

  setMeta("property", "og:type", type);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", canonicalUrl);
  setMeta("property", "og:image", resolvedImage);

  setMeta("name", "twitter:card", "summary_large_image");
  setMeta("name", "twitter:title", title);
  setMeta("name", "twitter:description", description);
  setMeta("name", "twitter:image", resolvedImage);
}

// For pages that shouldn't be indexed (404s, admin) but still need a title set.
export function setNoIndexSEO(title) {
  if (title) document.title = title;
  setMeta("name", "robots", "noindex, follow");
}

// Injects (or clears, when data is falsy) a page-specific JSON-LD block —
// e.g. Product or BreadcrumbList schema for the current route. `data` may be
// a single schema.org object or an array of them. The site-wide Organization
// schema lives as a static script in index.html since it never changes.
export function setJSONLD(data) {
  const existing = document.getElementById("tm-jsonld");
  if (!data) {
    existing?.remove();
    return;
  }
  const tag = existing || document.createElement("script");
  tag.type = "application/ld+json";
  tag.id = "tm-jsonld";
  tag.text = JSON.stringify(data);
  if (!existing) document.head.appendChild(tag);
}

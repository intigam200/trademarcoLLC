// Runtime data-access layer for the product catalog. Products live as
// per-manufacturer JSON chunks under src/data/catalog/products/ (generated
// by scripts/import-products.mjs), lazy-loaded and code-split by Vite —
// so the app only ever downloads the manufacturer(s) a visitor is actually
// browsing, regardless of whether the catalog holds 10 products or 100,000.

import { MANUFACTURERS, PRODUCTS as CATEGORIES } from "../data/content";

const chunkLoaders = import.meta.glob("../data/catalog/products/*.json");
const chunkCache = new Map();

function loaderFor(manufacturerSlug) {
  return chunkLoaders[`../data/catalog/products/${manufacturerSlug}.json`];
}

export async function getManufacturerCatalog(manufacturerSlug) {
  if (chunkCache.has(manufacturerSlug)) return chunkCache.get(manufacturerSlug);
  const loader = loaderFor(manufacturerSlug);
  const products = loader ? (await loader()).default : [];
  chunkCache.set(manufacturerSlug, products);
  return products;
}

export async function getProduct(manufacturerSlug, productSlug) {
  const products = await getManufacturerCatalog(manufacturerSlug);
  return products.find((p) => p.slug === productSlug) ?? null;
}

export async function getRelatedProducts(product, limit = 4) {
  if (!product?.relatedProducts?.length) return [];
  const results = [];
  for (const ref of product.relatedProducts.slice(0, limit)) {
    const [mfrSlug, slug] = ref.split("/");
    if (!mfrSlug || !slug) continue;
    const related = await getProduct(mfrSlug, slug);
    if (related) results.push(related);
  }
  return results;
}

export function getManufacturerInfo(manufacturerSlug) {
  return MANUFACTURERS.find((m) => m.slug === manufacturerSlug) ?? null;
}

export function getCategoryInfo(categorySlug) {
  return CATEGORIES.find((c) => c.slug === categorySlug) ?? null;
}

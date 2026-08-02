// Canonical schema for catalog products. Shared by the CSV import script
// (scripts/import-products.mjs) and available for reuse anywhere a product
// needs to be validated or built from raw row data.

export const CSV_COLUMNS = [
  "partNumber",
  "manufacturer",
  "category",
  "series",
  "productName",
  "shortDescription",
  "longDescription",
  "applications",
  "industries",
  "alternativePartNumbers",
  "relatedProducts",
  "rfqAvailable",
  "seoTitle",
  "seoDescription",
];

export const REQUIRED_FIELDS = ["partNumber", "manufacturer", "category", "productName", "shortDescription"];

// Cells that hold multiple values, semicolon-separated (e.g. "Oil & Gas;Mining").
export const MULTI_VALUE_FIELDS = ["applications", "industries", "alternativePartNumbers", "relatedProducts"];

/**
 * @typedef {Object} CatalogProduct
 * @property {string} id                  - `${manufacturer}/${slug}`, globally unique
 * @property {string} slug                - URL-safe slug derived from partNumber
 * @property {string} partNumber
 * @property {string} manufacturer        - manufacturer slug, see MANUFACTURERS in src/data/content.js
 * @property {string} category            - category slug, see PRODUCTS in src/data/content.js
 * @property {string} series
 * @property {string} productName
 * @property {string} shortDescription
 * @property {string} longDescription
 * @property {string[]} applications
 * @property {string[]} industries        - industry names, see INDUSTRIES in src/data/content.js
 * @property {string[]} alternativePartNumbers
 * @property {string[]} relatedProducts   - refs in `${manufacturer}/${slug}` form
 * @property {boolean} rfqAvailable
 * @property {{ title: string, description: string }} seo
 */

export function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitMulti(value) {
  return String(value ?? "")
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Builds a CatalogProduct from a raw CSV row. Only checks field presence —
 * cross-referential validation (manufacturer/category/industry exist,
 * duplicate ids) is the caller's responsibility since it needs the rest of
 * the catalog/content data to check against.
 *
 * @returns {{ product: CatalogProduct|null, errors: string[] }}
 */
export function buildProduct(row, rowNumber) {
  const errors = [];
  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || !String(row[field]).trim()) {
      errors.push(`Row ${rowNumber}: missing required field "${field}"`);
    }
  }
  if (errors.length) return { product: null, errors };

  const partNumber = row.partNumber.trim();
  const manufacturer = slugify(row.manufacturer);
  const slug = slugify(partNumber);

  if (!manufacturer || !slug) {
    return { product: null, errors: [`Row ${rowNumber}: could not derive a valid slug from partNumber/manufacturer`] };
  }

  const product = {
    id: `${manufacturer}/${slug}`,
    slug,
    partNumber,
    manufacturer,
    category: slugify(row.category),
    series: row.series ? row.series.trim() : "",
    productName: row.productName.trim(),
    shortDescription: row.shortDescription.trim(),
    longDescription: (row.longDescription && row.longDescription.trim()) || row.shortDescription.trim(),
    applications: splitMulti(row.applications),
    industries: splitMulti(row.industries),
    alternativePartNumbers: splitMulti(row.alternativePartNumbers),
    relatedProducts: splitMulti(row.relatedProducts),
    rfqAvailable: row.rfqAvailable === undefined || row.rfqAvailable === "" ? true : /^(true|yes|1)$/i.test(row.rfqAvailable.trim()),
    seo: {
      title: (row.seoTitle && row.seoTitle.trim()) || `${row.productName.trim()} | ${row.manufacturer.trim()} | TradeMarco`,
      description: (row.seoDescription && row.seoDescription.trim()) || row.shortDescription.trim(),
    },
  };

  return { product, errors: [] };
}

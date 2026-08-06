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
      title: (row.seoTitle && row.seoTitle.trim()) || `${row.productName.trim()} | ${row.manufacturer.trim()} | Trademarco Global`,
      description: (row.seoDescription && row.seoDescription.trim()) || row.shortDescription.trim(),
    },
  };

  return { product, errors: [] };
}

/**
 * Minimal RFC4180 CSV parser (quoted fields, escaped "" quotes, CRLF/LF).
 * Pure string logic — no Node APIs — so it runs identically in the CLI
 * import script and in the browser-based admin Import wizard.
 */
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { rows.push(row); row = []; };

  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i];
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushField();
      pushRow();
    } else {
      field += c;
    }
  }
  if (field.length || row.length) { pushField(); pushRow(); }

  const cleaned = rows.filter((r, idx) => !(idx === rows.length - 1 && r.length === 1 && r[0] === ""));
  const headers = cleaned[0] || [];
  return cleaned.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

/**
 * Cross-validates a batch of raw CSV rows against the rest of the catalog
 * (manufacturer/category/industry existence, duplicate ids) and returns a
 * structured result. Shared by the CLI import script and the admin Import
 * wizard so both report identical validation outcomes for the same file.
 */
export function validateRows(rows, { manufacturerSlugs, categorySlugs, industryNames }) {
  const validProducts = [];
  const issues = { missingFields: [], unknownManufacturer: [], unknownCategory: [], unknownIndustry: [], duplicate: [] };
  const seenIds = new Set();

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const { product, errors } = buildProduct(row, rowNumber);
    if (errors.length) {
      issues.missingFields.push({ rowNumber, message: errors.join("; ") });
      return;
    }
    if (!manufacturerSlugs.has(product.manufacturer)) {
      issues.unknownManufacturer.push({ rowNumber, message: `Unknown manufacturer "${row.manufacturer}"` });
      return;
    }
    if (!categorySlugs.has(product.category)) {
      issues.unknownCategory.push({ rowNumber, message: `Unknown category "${row.category}"` });
      return;
    }
    const badIndustries = product.industries.filter((i) => !industryNames.has(i.toLowerCase()));
    if (badIndustries.length) {
      issues.unknownIndustry.push({ rowNumber, message: `Unknown industr${badIndustries.length > 1 ? "ies" : "y"} "${badIndustries.join(", ")}"` });
      return;
    }
    if (seenIds.has(product.id)) {
      issues.duplicate.push({ rowNumber, message: `Duplicate part number for "${product.id}"` });
      return;
    }
    seenIds.add(product.id);
    validProducts.push(product);
  });

  return { validProducts, issues };
}

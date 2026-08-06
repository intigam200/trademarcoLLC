// Import Center — parsing, column mapping and validation for the admin bulk-
// import wizard (src/admin/pages/Import.jsx). The uploaded file is always the
// source of truth: nothing here ever invents a product name, part number,
// manufacturer or category — every one of those values is copied verbatim
// from whichever spreadsheet column the user (or an unambiguous auto-guess)
// maps it to. Turns the mapped rows into an editable, per-row-validated
// draft that maps 1:1 onto the existing products table, then hands off to
// bulkUpsertProducts (see src/lib/supabase/products.js) — the only thing
// that ever writes to Supabase.
import { slugify, parseCSV } from "../data/catalog/schema";

// ---------------------------------------------------------------------------
// Column mapping. Real-world spreadsheets rarely use our internal camelCase
// field names, so headers are auto-guessed against this alias table — but
// the guess is only ever a *starting point* shown to the admin in the Map
// Columns step (see Import.jsx). Nothing is imported under a guessed mapping
// without the admin seeing and confirming it first, and any column can be
// remapped or set to "Do not import" manually.
// ---------------------------------------------------------------------------
export const MAPPABLE_FIELDS = [
  { key: "productName", label: "Product Name" },
  { key: "partNumber", label: "Part Number" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "series", label: "Series" },
  { key: "price", label: "Price" },
  { key: "size", label: "Size" },
  { key: "rating", label: "Rating" },
  { key: "type", label: "Type" },
  { key: "shortDescription", label: "Short Description" },
  { key: "longDescription", label: "Long Description" },
  { key: "applications", label: "Applications" },
  { key: "industries", label: "Industries" },
  { key: "alternativePartNumbers", label: "Alternative Part Numbers" },
  { key: "relatedProducts", label: "Related Products" },
  { key: "rfqAvailable", label: "RFQ Available" },
  { key: "seoTitle", label: "SEO Title" },
  { key: "seoDescription", label: "SEO Description" },
  { key: "imageUrl", label: "Image URL" },
  { key: "datasheetUrl", label: "Datasheet URL" },
];

// Guess candidates only — deliberately narrow (no "sku" → partNumber, for
// example) so an ambiguous column is left for the admin to choose rather
// than risking a wrong-but-confident auto-match silently overwriting a real
// official part number with the wrong column's data.
const HEADER_ALIASES = {
  "part number": "partNumber", "part no": "partNumber", "part no.": "partNumber",
  "partnumber": "partNumber", "official part number": "partNumber", "mpn": "partNumber",
  "manufacturer part number": "partNumber", "item number": "partNumber",
  "manufacturer": "manufacturer", "brand": "manufacturer", "make": "manufacturer", "vendor": "manufacturer",
  "category": "category", "product category": "category",
  "series": "series", "product series": "series",
  "price": "price", "list price": "price", "unit price": "price", "msrp": "price",
  "size": "size", "dimension": "size", "dimensions": "size",
  "rating": "rating", "pressure rating": "rating", "temperature rating": "rating", "class": "rating",
  "type": "type", "product type": "type",
  "product name": "productName", "productname": "productName", "name": "productName", "title": "productName",
  "short description": "shortDescription", "shortdescription": "shortDescription", "summary": "shortDescription",
  "long description": "longDescription", "longdescription": "longDescription", "details": "longDescription", "full description": "longDescription",
  "description": "longDescription",
  "applications": "applications", "application": "applications",
  "industries": "industries", "industry": "industries",
  "alternative part numbers": "alternativePartNumbers", "alternate part numbers": "alternativePartNumbers",
  "alt part numbers": "alternativePartNumbers", "cross reference": "alternativePartNumbers", "cross references": "alternativePartNumbers",
  "related products": "relatedProducts",
  "rfq available": "rfqAvailable",
  "seo title": "seoTitle", "seotitle": "seoTitle",
  "seo description": "seoDescription", "seodescription": "seoDescription",
  "image": "imageUrl", "image url": "imageUrl", "imageurl": "imageUrl", "image link": "imageUrl",
  "datasheet": "datasheetUrl", "datasheet url": "datasheetUrl", "datasheeturl": "datasheetUrl", "datasheet link": "datasheetUrl", "datasheet reference": "datasheetUrl",
};

function normalizeHeader(header) {
  return String(header ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** Best-guess target field for a raw spreadsheet header, or null if unrecognized. */
export function guessFieldForHeader(header) {
  return HEADER_ALIASES[normalizeHeader(header)] ?? null;
}

/**
 * Parses the first sheet of an .xlsx/.xls file into { headers, rows }, where
 * rows are keyed by the exact original header text — no field mapping
 * applied yet. That happens explicitly in the Map Columns step.
 */
export async function parseExcelFile(file) {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return { headers: [], rows: [] };

  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = (grid[0] ?? []).map((h) => String(h ?? "").trim()).filter(Boolean);
  const rows = grid.slice(1)
    .filter((r) => r.some((cell) => String(cell ?? "").trim() !== ""))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] == null ? "" : String(r[i]).trim()])));

  return { headers, rows };
}

/**
 * Parses a CSV file into { headers, rows }, same shape as parseExcelFile —
 * reuses the existing RFC4180 parser (parseCSV) and just reads back the
 * header order from it.
 */
export async function parseCSVFile(file) {
  const text = await file.text();
  const rows = parseCSV(text);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, rows };
}

/**
 * Applies an admin-confirmed { header: targetFieldKey | null } mapping to
 * one raw row, producing the row shape buildDraftRow expects. This is the
 * only place spreadsheet values become product fields — a column that isn't
 * mapped to a field is simply not carried over (never guessed at this stage).
 */
export function applyColumnMapping(rawRow, mapping) {
  const out = {};
  for (const [header, field] of Object.entries(mapping)) {
    if (!field) continue;
    out[field] = rawRow[header] ?? "";
  }
  return out;
}

// ---------------------------------------------------------------------------
// PDF — text extraction (pdf.js) + heuristic field guessing. A PDF datasheet
// describes exactly one product, so this always returns a single row. This
// is best-effort: every guessed field flows straight into the editable
// preview table so it's reviewed/corrected before anything is written.
// ---------------------------------------------------------------------------
const PART_NUMBER_RE = /(?:part\s*(?:no\.?|number)|model\s*(?:no\.?|number)?|p\/n|item\s*no\.?)\s*[:#]?\s*([A-Z0-9][A-Z0-9\-/.]{2,})/i;
const BOILERPLATE_LINE_RE = /^(datasheet|technical data sheet|product data sheet|specification sheet|spec sheet|catalog(ue)?|installation guide)s?$/i;

async function extractPdfLines(file) {
  const pdfjsLib = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const lines = [];

  for (let pageNum = 1; pageNum <= Math.min(pdf.numPages, 5); pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    let currentY = null;
    let currentLine = [];
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (currentY === null || Math.abs(y - currentY) <= 2) {
        currentLine.push(item.str);
        currentY = currentY ?? y;
      } else {
        if (currentLine.length) lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
        currentLine = [item.str];
        currentY = y;
      }
    }
    if (currentLine.length) lines.push(currentLine.join(" ").replace(/\s+/g, " ").trim());
  }

  return lines.filter(Boolean);
}

function guessProductNameLine(lines) {
  for (const line of lines.slice(0, 20)) {
    if (line.length < 4 || line.length > 90) continue;
    if (BOILERPLATE_LINE_RE.test(line)) continue;
    if (PART_NUMBER_RE.test(line)) continue;
    return line;
  }
  return "";
}

function guessDescription(lines, productNameLine) {
  const startIdx = productNameLine ? lines.indexOf(productNameLine) + 1 : 0;
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].length >= 40) return lines[i];
  }
  return "";
}

function findManufacturerInText(text, manufacturers) {
  const lower = text.toLowerCase();
  const hit = manufacturers.find((m) => lower.includes(m.name.toLowerCase()));
  return hit ? hit.name : "";
}

/**
 * Best-effort field extraction from a PDF datasheet. Returns a single raw
 * row plus the original File (so the confirmed import can upload the PDF
 * itself to the datasheets bucket and attach it to the created product).
 */
export async function parsePdfFile(file, { manufacturers }) {
  const lines = await extractPdfLines(file);
  const fullText = lines.join("\n");

  const partMatch = fullText.match(PART_NUMBER_RE);
  const productNameLine = guessProductNameLine(lines);

  const row = {
    partNumber: partMatch ? partMatch[1].trim() : "",
    manufacturer: findManufacturerInText(fullText, manufacturers),
    category: "",
    series: "",
    productName: productNameLine,
    shortDescription: guessDescription(lines, productNameLine),
    longDescription: "",
    applications: "",
    industries: "",
    alternativePartNumbers: "",
    relatedProducts: "",
    rfqAvailable: "true",
    seoTitle: "",
    seoDescription: "",
    imageUrl: "",
    datasheetUrl: "",
  };

  return [{ row, pdfFile: file }];
}

// ---------------------------------------------------------------------------
// Manufacturer / category resolution — matches free-text against the real
// Supabase-backed lists (exact slug, exact name, then substring) so the
// preview can offer a correct dropdown even when the source text doesn't
// match exactly (e.g. "ABB Ltd" against a manufacturer named "ABB").
// ---------------------------------------------------------------------------
function resolveByNameOrSlug(text, list) {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) return null;
  const slug = slugify(trimmed);
  const bySlug = list.find((x) => x.slug === slug);
  if (bySlug) return bySlug;
  const lower = trimmed.toLowerCase();
  const byName = list.find((x) => x.name.toLowerCase() === lower);
  if (byName) return byName;
  const byContains = list.find((x) => x.name.toLowerCase().includes(lower) || lower.includes(x.name.toLowerCase()));
  return byContains ?? null;
}

function splitMultiLoose(value) {
  return String(value ?? "")
    .split(/[;,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

let rowKeySeq = 0;
function nextRowKey() {
  rowKeySeq += 1;
  return `row-${Date.now()}-${rowKeySeq}`;
}

/**
 * Builds one editable draft row from a raw parsed row (from CSV, Excel or
 * PDF) — resolves manufacturer/category against the live lists and computes
 * the row's own field-level errors. Duplicate-part-number checking runs
 * separately, across the whole batch (see revalidateDraftRows).
 */
export function buildDraftRow(rawRow, { manufacturers, categories }, extra = {}) {
  const manufacturerMatch = resolveByNameOrSlug(rawRow.manufacturer, manufacturers);
  const categoryMatch = resolveByNameOrSlug(rawRow.category, categories);

  return {
    key: nextRowKey(),
    raw: {
      partNumber: String(rawRow.partNumber ?? "").trim(),
      series: String(rawRow.series ?? "").trim(),
      price: String(rawRow.price ?? "").trim(),
      size: String(rawRow.size ?? "").trim(),
      rating: String(rawRow.rating ?? "").trim(),
      type: String(rawRow.type ?? "").trim(),
      productName: String(rawRow.productName ?? "").trim(),
      shortDescription: String(rawRow.shortDescription ?? "").trim(),
      longDescription: String(rawRow.longDescription ?? "").trim(),
      applications: splitMultiLoose(rawRow.applications),
      industries: splitMultiLoose(rawRow.industries),
      alternativePartNumbers: splitMultiLoose(rawRow.alternativePartNumbers),
      relatedProducts: splitMultiLoose(rawRow.relatedProducts),
      rfqAvailable: rawRow.rfqAvailable === undefined || rawRow.rfqAvailable === ""
        ? true : /^(true|yes|1)$/i.test(String(rawRow.rfqAvailable).trim()),
      seoTitle: String(rawRow.seoTitle ?? "").trim(),
      seoDescription: String(rawRow.seoDescription ?? "").trim(),
      imageUrl: String(rawRow.imageUrl ?? "").trim(),
      datasheetUrl: String(rawRow.datasheetUrl ?? "").trim(),
      manufacturerText: String(rawRow.manufacturer ?? "").trim(),
      categoryText: String(rawRow.category ?? "").trim(),
    },
    manufacturerId: manufacturerMatch?.id ?? "",
    categoryId: categoryMatch?.id ?? "",
    pdfFile: extra.pdfFile ?? null,
    errors: [],
    status: "error",
    existingMatch: null,
  };
}

function validateSingleRow(row, duplicateKeyCounts) {
  const errors = [];
  if (!row.raw.partNumber) errors.push("Missing part number");
  if (!row.raw.productName) errors.push("Missing product name");
  if (!row.manufacturerId) errors.push("Unknown manufacturer — select one");
  if (!row.categoryId) errors.push("Invalid category — select one");

  // Duplicate check is by part number alone (not paired with manufacturer) —
  // the same part number appearing twice in one file is almost always a
  // mistake even if the manufacturer text differs between the two rows.
  if (row.raw.partNumber) {
    const key = slugify(row.raw.partNumber);
    if ((duplicateKeyCounts.get(key) ?? 0) > 1) errors.push("Duplicate part number in this file");
  }

  return { errors, status: errors.length ? "error" : "valid" };
}

/**
 * Re-runs validation across the whole batch (needed after any inline edit,
 * since duplicate-part-number detection depends on every other row).
 */
export function revalidateDraftRows(rows) {
  const duplicateKeyCounts = new Map();
  for (const row of rows) {
    if (!row.raw.partNumber) continue;
    const key = slugify(row.raw.partNumber);
    duplicateKeyCounts.set(key, (duplicateKeyCounts.get(key) ?? 0) + 1);
  }
  return rows.map((row) => {
    const { errors, status } = validateSingleRow(row, duplicateKeyCounts);
    return { ...row, errors, status };
  });
}

/**
 * Cross-checks draft rows' part numbers against products already in
 * Supabase (queried by the caller for just the slugs in this batch, so this
 * scales regardless of total catalog size). Purely informational — a match
 * doesn't block import (bulkUpsertProducts already updates existing rows
 * correctly) — it just tells the admin, before they click Import, whether a
 * row will create a new product or update one that already exists.
 */
export function annotateExistingMatches(rows, existingProducts) {
  const bySlug = new Map();
  for (const p of existingProducts) {
    if (!bySlug.has(p.slug)) bySlug.set(p.slug, []);
    bySlug.get(p.slug).push(p);
  }
  return rows.map((row) => {
    if (!row.raw.partNumber) return { ...row, existingMatch: null };
    const matches = bySlug.get(slugify(row.raw.partNumber)) ?? [];
    if (!matches.length) return { ...row, existingMatch: null };
    const sameManufacturer = matches.find((m) => m.manufacturer_id === row.manufacturerId);
    const match = sameManufacturer ?? matches[0];
    return {
      ...row,
      existingMatch: {
        id: match.id,
        sameManufacturer: Boolean(sameManufacturer),
        manufacturerName: match.manufacturer?.name ?? "another manufacturer",
      },
    };
  });
}

/**
 * Converts a valid draft row into the exact payload shape products.js /
 * Supabase expects. Callers are responsible for uploading pdfFile (if any)
 * first and passing the resulting URL in as datasheetUrlOverride.
 */
export function draftRowToProductPayload(row, { status, datasheetUrlOverride } = {}) {
  const partNumber = row.raw.partNumber;
  const slug = slugify(partNumber);
  const shortDescription = row.raw.shortDescription || row.raw.productName;
  return {
    slug,
    part_number: partNumber,
    manufacturer_id: row.manufacturerId,
    category_id: row.categoryId,
    series: row.raw.series || null,
    price: row.raw.price && !Number.isNaN(Number(row.raw.price)) ? Number(row.raw.price) : null,
    size: row.raw.size || null,
    rating: row.raw.rating || null,
    type: row.raw.type || null,
    product_name: row.raw.productName,
    short_description: shortDescription,
    long_description: row.raw.longDescription || shortDescription,
    applications: row.raw.applications,
    industries: row.raw.industries,
    alternative_part_numbers: row.raw.alternativePartNumbers,
    rfq_available: row.raw.rfqAvailable,
    image_url: /^https?:\/\//i.test(row.raw.imageUrl) ? row.raw.imageUrl : null,
    datasheet_url: datasheetUrlOverride || (/^https?:\/\//i.test(row.raw.datasheetUrl) ? row.raw.datasheetUrl : null),
    seo_title: row.raw.seoTitle || null,
    seo_description: row.raw.seoDescription || null,
    status,
  };
}

/** Builds a downloadable CSV Blob for rows that failed to import. */
export function failedRowsToCSV(failedRows) {
  const headers = ["partNumber", "manufacturer", "category", "productName", "shortDescription", "error"];
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.join(",")];
  for (const { row, error } of failedRows) {
    lines.push([
      row.raw.partNumber, row.raw.manufacturerText, row.raw.categoryText,
      row.raw.productName, row.raw.shortDescription, error,
    ].map(escape).join(","));
  }
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
}

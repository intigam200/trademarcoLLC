// Imports catalog products from a CSV file into per-manufacturer JSON
// chunks under src/data/catalog/products/, consumed lazily at runtime by
// src/lib/catalog.js. This script is the only place raw CSV data becomes
// part of the app — adding products later means running this again with a
// new/updated CSV, not touching any component code.
//
// Usage:
//   node scripts/import-products.mjs [--csv=path] [--out=path] [--dry-run]
//
// Defaults: --csv=data/catalog/products.example.csv --out=src/data/catalog/products

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { MANUFACTURERS, PRODUCTS as CATEGORIES, INDUSTRIES } from "../src/data/content.js";
import { buildProduct } from "../src/data/catalog/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function getArg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(`--${name}=`.length) : fallback;
}

function parseCSV(text) {
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
  const headers = cleaned[0];
  return cleaned.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])));
}

function main() {
  const csvPath = resolve(rootDir, getArg("csv", "data/catalog/products.example.csv"));
  const outDir = resolve(rootDir, getArg("out", "src/data/catalog/products"));
  const dryRun = process.argv.includes("--dry-run");

  const csvText = readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);

  const manufacturerSlugs = new Set(MANUFACTURERS.map((m) => m.slug));
  const categorySlugs = new Set(CATEGORIES.map((c) => c.slug));
  const industryNames = new Set(INDUSTRIES.map((i) => i.name.toLowerCase()));

  const errors = [];
  const seenIds = new Set();
  const byManufacturer = new Map();

  rows.forEach((row, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const { product, errors: rowErrors } = buildProduct(row, rowNumber);
    if (rowErrors.length) { errors.push(...rowErrors); return; }

    if (!manufacturerSlugs.has(product.manufacturer)) {
      errors.push(`Row ${rowNumber}: unknown manufacturer "${row.manufacturer}" (not in MANUFACTURERS)`);
      return;
    }
    if (!categorySlugs.has(product.category)) {
      errors.push(`Row ${rowNumber}: unknown category "${row.category}" (not in PRODUCTS categories)`);
      return;
    }
    const badIndustries = product.industries.filter((i) => !industryNames.has(i.toLowerCase()));
    if (badIndustries.length) {
      errors.push(`Row ${rowNumber}: unknown industr${badIndustries.length > 1 ? "ies" : "y"} "${badIndustries.join(", ")}"`);
      return;
    }
    if (seenIds.has(product.id)) {
      errors.push(`Row ${rowNumber}: duplicate product id "${product.id}" (part number already used for this manufacturer)`);
      return;
    }
    seenIds.add(product.id);

    if (!byManufacturer.has(product.manufacturer)) byManufacturer.set(product.manufacturer, []);
    byManufacturer.get(product.manufacturer).push(product);
  });

  if (errors.length) {
    console.error(`\nImport failed with ${errors.length} error(s):\n`);
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }

  const indexEntries = [];
  for (const products of byManufacturer.values()) {
    indexEntries.push(...products.map((p) => ({
      id: p.id, slug: p.slug, manufacturer: p.manufacturer, partNumber: p.partNumber,
      productName: p.productName, category: p.category,
    })));
  }

  console.log(`Parsed ${rows.length} row(s) -> ${indexEntries.length} valid product(s) across ${byManufacturer.size} manufacturer(s).`);

  if (dryRun) {
    console.log("Dry run: no files written.");
    return;
  }

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  for (const [mfrSlug, products] of byManufacturer) {
    writeFileSync(resolve(outDir, `${mfrSlug}.json`), JSON.stringify(products, null, 2));
  }
  writeFileSync(resolve(outDir, "_index.json"), JSON.stringify(indexEntries, null, 2));

  console.log(`Wrote ${byManufacturer.size} manufacturer chunk(s) + _index.json to ${outDir}`);
}

main();

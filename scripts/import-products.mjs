// Imports catalog products from a CSV file into per-manufacturer JSON
// chunks under src/data/catalog/products/, consumed lazily at runtime by
// src/lib/catalog.js. This script is the only place raw CSV data becomes
// part of the app — adding products later means running this again with a
// new/updated CSV, not touching any component code.
//
// Parsing/validation logic lives in src/data/catalog/schema.js and is
// shared with the admin Import wizard (src/admin/pages/Import.jsx), so a
// CSV validates identically whether it's checked in the browser or here.
//
// Usage:
//   node scripts/import-products.mjs [--csv=path] [--out=path] [--dry-run]
//
// Defaults: --csv=data/catalog/products.example.csv --out=src/data/catalog/products

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { MANUFACTURERS, PRODUCTS as CATEGORIES, INDUSTRIES } from "../src/data/content.js";
import { parseCSV, validateRows } from "../src/data/catalog/schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function getArg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(`--${name}=`.length) : fallback;
}

function main() {
  const csvPath = resolve(rootDir, getArg("csv", "data/catalog/products.example.csv"));
  const outDir = resolve(rootDir, getArg("out", "src/data/catalog/products"));
  const dryRun = process.argv.includes("--dry-run");

  const csvText = readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);

  const { validProducts, issues } = validateRows(rows, {
    manufacturerSlugs: new Set(MANUFACTURERS.map((m) => m.slug)),
    categorySlugs: new Set(CATEGORIES.map((c) => c.slug)),
    industryNames: new Set(INDUSTRIES.map((i) => i.name.toLowerCase())),
  });

  const allIssues = Object.values(issues).flat();
  if (allIssues.length) {
    console.error(`\nImport failed with ${allIssues.length} error(s):\n`);
    for (const [type, list] of Object.entries(issues)) {
      list.forEach((i) => console.error(`  - [${type}] Row ${i.rowNumber}: ${i.message}`));
    }
    process.exit(1);
  }

  const byManufacturer = new Map();
  for (const product of validProducts) {
    if (!byManufacturer.has(product.manufacturer)) byManufacturer.set(product.manufacturer, []);
    byManufacturer.get(product.manufacturer).push(product);
  }

  const indexEntries = validProducts.map((p) => ({
    id: p.id, slug: p.slug, manufacturer: p.manufacturer, partNumber: p.partNumber,
    productName: p.productName, category: p.category,
  }));

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

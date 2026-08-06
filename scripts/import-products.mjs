// Bulk-imports catalog products from a CSV file straight into Supabase.
// Parsing/validation logic lives in src/data/catalog/schema.js and is shared
// with the admin Import wizard (src/admin/pages/Import.jsx), so a CSV
// validates identically whether it's checked in the browser or here.
//
// Requires SUPABASE_SERVICE_ROLE_KEY (server-only — never expose this to the
// browser) so it can write regardless of RLS, since this script has no admin
// login session of its own. Get it from Supabase Dashboard > Project
// Settings > API > service_role key.
//
// Usage:
//   node scripts/import-products.mjs [--csv=path] [--dry-run] [--publish]
//
// Defaults: --csv=data/catalog/products.example.csv, imports as drafts
// unless --publish is passed. --dry-run validates without writing anything.

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { parseCSV, validateRows } from "../src/data/catalog/schema.js";
import { INDUSTRIES } from "../src/data/content.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const CHUNK_SIZE = 500;

function getArg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(`--${name}=`.length) : fallback;
}

// Minimal .env loader so this script works standalone (no dotenv dependency).
function loadEnvFile() {
  try {
    const text = readFileSync(resolve(rootDir, ".env"), "utf8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let value = trimmed.slice(idx + 1).trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // no .env file present — rely on already-exported environment variables
  }
}

async function main() {
  loadEnvFile();

  const csvPath = resolve(rootDir, getArg("csv", "data/catalog/products.example.csv"));
  const dryRun = process.argv.includes("--dry-run");
  const publish = process.argv.includes("--publish");

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env — both are required (even for --dry-run, to validate manufacturer/category references).");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const csvText = readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvText);

  const [{ data: manufacturers, error: mfrError }, { data: categories, error: catError }] = await Promise.all([
    supabase.from("manufacturers").select("id, slug"),
    supabase.from("categories").select("id, slug"),
  ]);
  if (mfrError) throw mfrError;
  if (catError) throw catError;

  const manufacturerIdBySlug = new Map(manufacturers.map((m) => [m.slug, m.id]));
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const industryNames = new Set(INDUSTRIES.map((i) => i.name.toLowerCase()));

  const { validProducts, issues } = validateRows(rows, {
    manufacturerSlugs: new Set(manufacturerIdBySlug.keys()),
    categorySlugs: new Set(categoryIdBySlug.keys()),
    industryNames,
  });

  const allIssues = Object.values(issues).flat();
  if (allIssues.length) {
    console.error(`\nImport failed with ${allIssues.length} error(s):\n`);
    for (const [type, list] of Object.entries(issues)) {
      list.forEach((i) => console.error(`  - [${type}] Row ${i.rowNumber}: ${i.message}`));
    }
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} row(s) -> ${validProducts.length} valid product(s).`);

  if (dryRun) {
    console.log("Dry run: nothing written to Supabase.");
    return;
  }

  const rowsToInsert = validProducts.map((p) => ({
    slug: p.slug,
    part_number: p.partNumber,
    manufacturer_id: manufacturerIdBySlug.get(p.manufacturer),
    category_id: categoryIdBySlug.get(p.category),
    series: p.series || null,
    product_name: p.productName,
    short_description: p.shortDescription,
    long_description: p.longDescription || null,
    applications: p.applications,
    industries: p.industries,
    alternative_part_numbers: p.alternativePartNumbers,
    rfq_available: p.rfqAvailable,
    seo_title: p.seo.title,
    seo_description: p.seo.description,
    status: publish ? "published" : "draft",
  }));

  let inserted = 0;
  for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
    const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from("products").insert(chunk);
    if (error) {
      console.error(`Insert failed at rows ${i + 1}-${i + chunk.length}: ${error.message}`);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`Inserted ${inserted}/${rowsToInsert.length}...`);
  }

  console.log(`Done — inserted ${inserted} product(s) as ${publish ? "published" : "draft"}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

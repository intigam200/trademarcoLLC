// Submits site URLs to Google's Indexing API (urlNotifications:publish) so
// Google recrawls them faster than waiting on normal sitemap crawl cadence.
// URLs are read straight from the live sitemap (same data the site itself
// serves at /sitemap.xml, generated from Supabase by api/sitemap.js), so
// there's nothing to keep in sync here — new products just show up next run.
//
// The Indexing API's default quota is 200 publish requests/day per Google
// Cloud project. This script tracks which URLs have already been submitted
// successfully (scripts/.index-urls-state.json) so a run only ever sends
// URLs that haven't been confirmed yet, and reruns on later days naturally
// pick up where the previous run's quota cut off.
//
// Setup: see README.md ("Google Indexing API bulk-submit script").
//
// Usage:
//   node scripts/index-urls.js [--dry-run] [--limit=200] [--key=./service-account.json] [--reset]

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { GoogleAuth } from "google-auth-library";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

const SITEMAP_URL = "https://www.trademarco.com/sitemap.xml";
const INDEXING_ENDPOINT = "https://indexing.googleapis.com/v3/urlNotifications:publish";
const DAILY_LIMIT = 200;
const REQUEST_DELAY_MS = 100;
const STATE_FILE = resolve(__dirname, ".index-urls-state.json");

function getArg(name, fallback) {
  const found = process.argv.find((a) => a.startsWith(`--${name}=`));
  return found ? found.slice(`--${name}=`.length) : fallback;
}
function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

const DRY_RUN = hasFlag("dry-run");
const RESET = hasFlag("reset");
const DAILY_CAP = Number(getArg("limit", DAILY_LIMIT)) || DAILY_LIMIT;
const KEY_FILE = resolve(rootDir, getArg("key", "service-account.json"));

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadState() {
  if (RESET || !existsSync(STATE_FILE)) return { submitted: [] };
  try {
    const parsed = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    return { submitted: Array.isArray(parsed.submitted) ? parsed.submitted : [] };
  } catch {
    return { submitted: [] };
  }
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function fetchSitemapUrls() {
  const res = await fetch(SITEMAP_URL);
  if (!res.ok) throw new Error(`Failed to fetch sitemap: HTTP ${res.status}`);
  const xml = await res.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());
  if (urls.length === 0) throw new Error("Sitemap fetched but contained no <loc> entries.");
  return urls;
}

async function getAuthClient() {
  if (!existsSync(KEY_FILE)) {
    throw new Error(
      `Service account key not found at ${KEY_FILE}\n` +
      `Pass --key=path/to/service-account.json or place the file at the project root. See README.md for setup steps.`
    );
  }
  const auth = new GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  return auth.getClient();
}

async function submitUrl(client, url) {
  try {
    const res = await client.request({
      url: INDEXING_ENDPOINT,
      method: "POST",
      data: { url, type: "URL_UPDATED" },
    });
    return { url, ok: true, status: res.status, message: "OK" };
  } catch (err) {
    const status = err.response?.status ?? "ERR";
    const message = err.response?.data?.error?.message || err.message || "Unknown error";
    return { url, ok: false, status, message };
  }
}

async function main() {
  console.log(`Fetching sitemap from ${SITEMAP_URL} ...`);
  const allUrls = await fetchSitemapUrls();
  console.log(`Found ${allUrls.length} URLs in sitemap.`);

  const state = loadState();
  const submittedSet = new Set(state.submitted);
  const pending = allUrls.filter((u) => !submittedSet.has(u));

  if (pending.length === 0) {
    console.log("Nothing to do — every sitemap URL has already been submitted. Pass --reset to resubmit everything.");
    return;
  }

  const batch = pending.slice(0, DAILY_CAP);
  const remaining = pending.length - batch.length;

  console.log(`${pending.length} URL(s) not yet submitted. Sending ${batch.length} now (daily cap: ${DAILY_CAP}).`);
  if (DRY_RUN) console.log("--dry-run: no requests will actually be sent.\n");

  const client = DRY_RUN ? null : await getAuthClient();

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i];
    const prefix = `[${i + 1}/${batch.length}]`;

    if (DRY_RUN) {
      console.log(`${prefix} DRY-RUN would submit: ${url}`);
      continue;
    }

    const result = await submitUrl(client, url);
    if (result.ok) {
      successCount++;
      state.submitted.push(url);
      submittedSet.add(url);
      saveState(state); // persist incrementally so a crash mid-run doesn't lose progress
      console.log(`${prefix} OK    ${result.status}  ${url}`);
    } else {
      errorCount++;
      console.log(`${prefix} FAIL  ${result.status}  ${url}  — ${result.message}`);
    }

    if (i < batch.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  console.log("\n--- Summary ---");
  if (DRY_RUN) {
    console.log(`Would submit: ${batch.length}`);
  } else {
    console.log(`Success: ${successCount}`);
    console.log(`Errors:  ${errorCount}`);
  }
  if (remaining > 0) {
    console.log(`Remaining (not yet submitted, over today's cap): ${remaining} — run the script again tomorrow to continue.`);
  } else {
    console.log("All sitemap URLs are now submitted.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});

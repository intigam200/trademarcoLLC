import { JWT } from "google-auth-library";
import { verifyAdmin } from "../_lib/verifyAdmin.js";

// Google Search Console, read-only, via a service account added as a user on
// the Search Console property. Credentials live only in Vercel environment
// variables and never reach the browser:
//   GSC_SERVICE_ACCOUNT_JSON  the service account's JSON key (raw or base64)
//   GSC_PROPERTY              e.g. "sc-domain:trademarco.com" or
//                             "https://www.trademarco.com/"
// Setup steps are shown in the admin under SEO Growth Center → Settings.

const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";
const API = "https://searchconsole.googleapis.com/webmasters/v3";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function readCredentials() {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON;
  const property = process.env.GSC_PROPERTY;
  const missing = [];
  if (!raw) missing.push("GSC_SERVICE_ACCOUNT_JSON");
  if (!property) missing.push("GSC_PROPERTY");
  if (missing.length) return { missing };
  try {
    const json = JSON.parse(raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"));
    if (!json.client_email || !json.private_key) return { missing: [], invalid: "The key is missing client_email or private_key." };
    return { missing: [], property, email: json.client_email, key: json.private_key };
  } catch {
    return { missing: [], invalid: "GSC_SERVICE_ACCOUNT_JSON is not valid JSON (raw or base64)." };
  }
}

function client(creds) {
  return new JWT({ email: creds.email, key: creds.key, scopes: [SCOPE] });
}

function googleError(err, serviceAccount) {
  const status = err.response?.status;
  const message = err.response?.data?.error?.message || err.message;
  if (status === 403) return `Access denied — add ${serviceAccount} as a user on the Search Console property. (${message})`;
  if (status === 404) return `Property not found — check GSC_PROPERTY matches the property exactly. (${message})`;
  return message;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const user = await verifyAdmin(req);
  if (!user) return res.status(401).json({ error: "Not authorized." });

  const creds = readCredentials();
  const { action } = req.body || {};

  if (action === "status") {
    if (creds.missing.length || creds.invalid) {
      return res.status(200).json({ configured: false, connected: false, missing: creds.missing, invalid: creds.invalid || null });
    }
    try {
      await client(creds).request({ url: `${API}/sites/${encodeURIComponent(creds.property)}` });
      return res.status(200).json({ configured: true, connected: true, property: creds.property, serviceAccount: creds.email });
    } catch (err) {
      return res.status(200).json({ configured: true, connected: false, property: creds.property, serviceAccount: creds.email, error: googleError(err, creds.email) });
    }
  }

  if (action === "query") {
    if (creds.missing.length || creds.invalid) return res.status(409).json({ error: "Search Console is not configured." });
    const { startDate, endDate, dimension } = req.body;
    if (!DATE.test(startDate || "") || !DATE.test(endDate || "") || startDate > endDate) {
      return res.status(400).json({ error: "startDate and endDate must be YYYY-MM-DD, start before end." });
    }
    const dimensions = dimension === "page" ? ["page"] : dimension === "date" ? ["date"] : dimension === "none" ? [] : ["query"];
    try {
      const { data } = await client(creds).request({
        url: `${API}/sites/${encodeURIComponent(creds.property)}/searchAnalytics/query`,
        method: "POST",
        data: { startDate, endDate, dimensions, rowLimit: dimensions.length ? 1000 : 1, dataState: "final" },
      });
      return res.status(200).json({ rows: data.rows || [], responseAggregationType: data.responseAggregationType || null });
    } catch (err) {
      return res.status(502).json({ error: googleError(err, creds.email) });
    }
  }

  return res.status(400).json({ error: "Unknown action." });
}

import { createClient } from "@supabase/supabase-js";

let client = null;

// Service-role Supabase client for trusted server-side code only — never
// import this from browser-bundled code. Bypasses Row Level Security, which
// is the point: api/rfq.js is now the only writer of rfqs rows, after its
// own validation/sanitization/spam checks have already run.
export function getSupabaseAdmin() {
  if (client) return client;
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

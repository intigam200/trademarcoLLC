import { createClient } from "@supabase/supabase-js";

// The single Supabase client for the whole app — every module under
// src/lib/supabase/*, the admin panel and the public pages all import this
// one instance. Do not call createClient() anywhere else.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env " +
    "(see .env.example) — Supabase-backed features (admin login, catalog data) will not work until then."
  );
}

// createClient() throws synchronously if either argument is empty, which
// would crash the whole app at import time before Supabase is configured.
// Fall back to a placeholder so the module loads; every real call will then
// fail at the network layer and surface through the loading/error states
// already built into each page, instead of a blank white screen.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);

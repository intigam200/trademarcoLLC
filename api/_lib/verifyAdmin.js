import { createClient } from "@supabase/supabase-js";

// Verifies the Supabase session token an admin-only route was called with.
// The admin panel has no server-side session of its own (it's pure client-side
// Supabase Auth) — the browser attaches its access token as a Bearer header,
// and this checks it against Supabase directly. Uses the anon key: verifying
// a token doesn't need service-role privileges, just confirmation it's real.
export async function verifyAdmin(req) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

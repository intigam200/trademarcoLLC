import { supabase } from "../../lib/supabase/client";

// The admin panel has no server session of its own — every call to an
// admin-only /api route attaches the current Supabase access token as a
// Bearer header, which the route verifies itself (see api/_lib/verifyAdmin.js).
async function authedPost(path, body) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export function searchProductImages(query) {
  return authedPost("/api/admin/image-search", { query }).then((r) => r.results);
}

export function fetchAndStoreImage(url) {
  return authedPost("/api/admin/image-fetch", { url }).then((r) => r.url);
}

import { supabase } from "./client";
import { isMissingSchema } from "./schemaStatus";

// Articles live in the `articles` table added by the SEO Growth Center
// migration. Every read reports `missing: true` instead of throwing while that
// migration hasn't been applied, so the public site and admin degrade quietly.

const LIST_FIELDS = "id, slug, title, excerpt, meta_title, meta_description, hero_image_url, hero_image_alt, primary_query, status, published_at, updated_at, manufacturer_id, category_id";

export async function listPublishedArticles() {
  const { data, error } = await supabase.from("articles").select(LIST_FIELDS).eq("status", "published").order("published_at", { ascending: false });
  if (isMissingSchema(error)) return { articles: [], missing: true };
  if (error) throw error;
  return { articles: data ?? [], missing: false };
}

export async function getPublishedArticle(slug) {
  const { data, error } = await supabase.from("articles").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  if (isMissingSchema(error)) return null;
  if (error) throw error;
  return data;
}

// ── Admin (authenticated) ─────────────────────────────────────────────────
export async function listAllArticles() {
  const { data, error } = await supabase.from("articles").select("*").order("updated_at", { ascending: false });
  if (isMissingSchema(error)) return { articles: [], missing: true };
  if (error) throw error;
  return { articles: data ?? [], missing: false };
}

export async function getArticle(id) {
  const { data, error } = await supabase.from("articles").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createArticle(fields) {
  const { data, error } = await supabase.from("articles").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function updateArticle(id, fields) {
  const { data, error } = await supabase.from("articles").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteArticle(id) {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

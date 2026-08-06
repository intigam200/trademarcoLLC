import { supabase } from "./client";

export async function listCategories({ status } = {}) {
  let query = supabase.from("categories").select("*").order("name", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getCategoryBySlug(slug) {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCategory(id) {
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createCategory(fields) {
  const { data, error } = await supabase.from("categories").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, fields) {
  const { data, error } = await supabase.from("categories").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function countCategories({ status } = {}) {
  let query = supabase.from("categories").select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

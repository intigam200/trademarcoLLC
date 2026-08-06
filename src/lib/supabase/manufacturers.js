import { supabase } from "./client";

export async function listManufacturers({ status } = {}) {
  let query = supabase.from("manufacturers").select("*").order("name", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getManufacturerBySlug(slug) {
  const { data, error } = await supabase.from("manufacturers").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getManufacturer(id) {
  const { data, error } = await supabase.from("manufacturers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function createManufacturer(fields) {
  const { data, error } = await supabase.from("manufacturers").insert(fields).select().single();
  if (error) throw error;
  return data;
}

export async function updateManufacturer(id, fields) {
  const { data, error } = await supabase.from("manufacturers").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteManufacturer(id) {
  const { error } = await supabase.from("manufacturers").delete().eq("id", id);
  if (error) throw error;
}

export async function countManufacturers({ status } = {}) {
  let query = supabase.from("manufacturers").select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

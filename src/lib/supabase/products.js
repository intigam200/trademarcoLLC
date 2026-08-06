import { supabase } from "./client";
import { getManufacturerBySlug } from "./manufacturers";

const PRODUCT_SELECT = `
  *,
  manufacturer:manufacturers ( id, slug, name, logo_url, logo_dark ),
  category:categories ( id, slug, name )
`;

export async function listProducts({ search, status, manufacturerId, categoryId } = {}) {
  let query = supabase.from("products").select(PRODUCT_SELECT).order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (manufacturerId) query = query.eq("manufacturer_id", manufacturerId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (search && search.trim()) {
    const term = search.trim().replace(/[%_]/g, "");
    query = query.or(`part_number.ilike.%${term}%,product_name.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Server-paginated variant of listProducts, used by the admin Products list
// so the browser never has to hold the whole catalog in memory at once —
// only the current page. Search/filter/sort all happen in the query itself.
export async function listProductsPage({ search, status, manufacturerId, categoryId, page = 1, pageSize = 25 } = {}) {
  let query = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" }).order("updated_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (manufacturerId) query = query.eq("manufacturer_id", manufacturerId);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (search && search.trim()) {
    const term = search.trim().replace(/[%_]/g, "");
    query = query.or(`part_number.ilike.%${term}%,product_name.ilike.%${term}%`);
  }
  const from = (page - 1) * pageSize;
  const { data, error, count } = await query.range(from, from + pageSize - 1);
  if (error) throw error;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getProduct(id) {
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

// Public storefront lookup: /manufacturers/:manufacturerSlug/:productSlug — only ever returns published products.
export async function getPublishedProductBySlugs(manufacturerSlug, productSlug) {
  const manufacturer = await getManufacturerBySlug(manufacturerSlug);
  if (!manufacturer) return null;
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("manufacturer_id", manufacturer.id)
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRelatedProducts(productId, limit = 4) {
  const { data: rels, error: relError } = await supabase
    .from("product_related")
    .select("related_product_id")
    .eq("product_id", productId)
    .limit(limit);
  if (relError) throw relError;

  const ids = (rels ?? []).map((r) => r.related_product_id);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .in("id", ids)
    .eq("status", "published");
  if (error) throw error;
  return data ?? [];
}

// Admin editor equivalent of getRelatedProducts: returns "manufacturer-slug/product-slug"
// text refs (what the Related Products tag input displays/edits) instead of full rows.
export async function getRelatedProductRefs(productId) {
  const { data: rels, error: relError } = await supabase
    .from("product_related")
    .select("related_product_id")
    .eq("product_id", productId);
  if (relError) throw relError;

  const ids = (rels ?? []).map((r) => r.related_product_id);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("products")
    .select("slug, manufacturer:manufacturers ( slug )")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []).map((p) => (p.manufacturer?.slug ? `${p.manufacturer.slug}/${p.slug}` : null)).filter(Boolean);
}

// Resolves a "manufacturer-slug/product-slug" text ref (as typed into the
// Related Products tag input) into a real product id. Returns null if it
// doesn't resolve to anything — callers should skip refs that don't resolve
// rather than fail the whole save.
export async function resolveProductRef(ref) {
  const [mfrSlug, productSlug] = String(ref).split("/").map((s) => s.trim());
  if (!mfrSlug || !productSlug) return null;
  const manufacturer = await getManufacturerBySlug(mfrSlug);
  if (!manufacturer) return null;
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("manufacturer_id", manufacturer.id)
    .eq("slug", productSlug)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function setRelatedProducts(productId, relatedProductIds) {
  const { error: deleteError } = await supabase.from("product_related").delete().eq("product_id", productId);
  if (deleteError) throw deleteError;
  if (!relatedProductIds.length) return;
  const rows = relatedProductIds.map((relatedProductId) => ({ product_id: productId, related_product_id: relatedProductId }));
  const { error } = await supabase.from("product_related").insert(rows);
  if (error) throw error;
}

export async function createProduct(fields) {
  const { data, error } = await supabase.from("products").insert(fields).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, fields) {
  const { data, error } = await supabase.from("products").update(fields).eq("id", id).select(PRODUCT_SELECT).single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function countProducts({ status } = {}) {
  let query = supabase.from("products").select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

// Used by the admin Import Center to flag rows whose part number already
// exists in the catalog before import. Scoped to just the slugs in the
// current batch (not a full-table scan), so this stays fast regardless of
// how many products are in the catalog overall.
export async function findProductsBySlugs(slugs) {
  if (!slugs.length) return [];
  const { data, error } = await supabase
    .from("products")
    .select("id, part_number, slug, manufacturer_id, manufacturer:manufacturers(name)")
    .in("slug", slugs);
  if (error) throw error;
  return data ?? [];
}

// Used by the admin Import Center's "Publish All" — flips every product
// written by the just-completed import from draft to published in one call.
export async function bulkSetStatus(ids, status) {
  if (!ids.length) return;
  const { error } = await supabase.from("products").update({ status }).in("id", ids);
  if (error) throw error;
}

// Used by the admin Products page's "Publish All" — a single server-side
// UPDATE...WHERE, not a fetch-all-then-update, so it stays fast regardless
// of how many drafts exist (no product list is ever pulled into the browser
// just to publish it).
export async function publishAllDrafts() {
  const { error } = await supabase.from("products").update({ status: "published" }).eq("status", "draft");
  if (error) throw error;
}

// Used by scripts/import-products.mjs and the admin Import wizard to bulk
// load a validated CSV batch. Insert in caller-controlled chunks to stay
// under request size limits for very large files.
export async function bulkInsertProducts(rows) {
  const { data, error } = await supabase.from("products").insert(rows).select("id, slug, manufacturer_id");
  if (error) throw error;
  return data ?? [];
}

// Used by the admin Import Center: insert-or-update by (manufacturer_id, slug)
// so re-importing a file with previously-imported part numbers updates those
// rows instead of failing on the unique constraint. Reports how many of the
// given rows were new vs. already existed, so the caller can report an
// accurate Imported/Updated split.
export async function bulkUpsertProducts(rows) {
  if (!rows.length) return { imported: 0, updated: 0, written: [] };

  const manufacturerIds = [...new Set(rows.map((r) => r.manufacturer_id))];
  const { data: existing, error: existingError } = await supabase
    .from("products")
    .select("manufacturer_id, slug")
    .in("manufacturer_id", manufacturerIds);
  if (existingError) throw existingError;

  const existingKeys = new Set((existing ?? []).map((e) => `${e.manufacturer_id}::${e.slug}`));
  const updated = rows.filter((r) => existingKeys.has(`${r.manufacturer_id}::${r.slug}`)).length;
  const imported = rows.length - updated;

  const { data, error } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "manufacturer_id,slug" })
    .select("id, slug, manufacturer_id");
  if (error) throw error;

  return { imported, updated, written: data ?? [] };
}

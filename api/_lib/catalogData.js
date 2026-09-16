import { createClient } from "@supabase/supabase-js";

// Read-only catalogue access shared by the bot renderer and llms.txt. Uses the
// anon key — the same visibility a browser has — so neither can ever surface a
// draft product or an inactive manufacturer.
let client;
function db() {
  if (!client) {
    client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  }
  return client;
}

const PRODUCT_FIELDS = `
  slug, part_number, series, product_name, short_description, long_description,
  applications, industries, image_url, datasheet_url, seo_title, seo_description,
  rfq_available, updated_at,
  manufacturer:manufacturers ( slug, name ),
  category:categories ( slug, name )
`;

export async function getProduct(manufacturerSlug, productSlug) {
  const { data: manufacturer } = await db()
    .from("manufacturers").select("id").eq("slug", manufacturerSlug).eq("status", "active").maybeSingle();
  if (!manufacturer) return null;

  const { data } = await db()
    .from("products").select(PRODUCT_FIELDS)
    .eq("manufacturer_id", manufacturer.id)
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle();
  return data ?? null;
}

export async function getManufacturer(slug) {
  const { data } = await db()
    .from("manufacturers").select("id, slug, name, description, seo_title, seo_description, website")
    .eq("slug", slug).eq("status", "active").maybeSingle();
  if (!data) return null;

  const { data: products } = await db()
    .from("products").select(PRODUCT_FIELDS)
    .eq("status", "published")
    .eq("manufacturer_id", data.id)
    .order("part_number");
  return { ...data, products: products ?? [] };
}

export async function listManufacturers() {
  const { data } = await db()
    .from("manufacturers").select("slug, name, description")
    .eq("status", "active").order("name");
  return data ?? [];
}

export async function listCategories() {
  const { data } = await db()
    .from("categories").select("slug, name, description, full_description, types")
    .eq("status", "active").order("name");
  return data ?? [];
}

export async function listProducts({ categorySlug } = {}) {
  let query = db().from("products").select(PRODUCT_FIELDS).eq("status", "published");
  if (categorySlug) {
    const { data: category } = await db().from("categories").select("id").eq("slug", categorySlug).maybeSingle();
    if (!category) return [];
    query = query.eq("category_id", category.id);
  }
  const { data } = await query.order("part_number");
  return data ?? [];
}

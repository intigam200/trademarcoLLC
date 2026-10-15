import { createClient } from "@supabase/supabase-js";

// Read-only catalogue access shared by the bot renderer and llms.txt. Uses the
// anon key — the same visibility a browser has — so neither can ever surface a
// draft product or an inactive manufacturer.
//
// Every lookup is a single round trip (or several in parallel), never a chain:
// the functions run a long way from the database, and each sequential query
// cost the crawler close to a second.
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

// Same as PRODUCT_FIELDS, but the manufacturer join is !inner so the product
// can be filtered on its brand's slug and status in the same query.
const PRODUCT_FIELDS_BY_BRAND = PRODUCT_FIELDS.replace(
  "manufacturer:manufacturers ( slug, name )",
  "manufacturer:manufacturers!inner ( slug, name, status )"
);

// Matches the order ProductDetail.jsx uses for its previous/next links.
function byPartNumber(a, b) {
  return (a.part_number ?? "").localeCompare(b.part_number ?? "", undefined, { numeric: true });
}

export async function getProduct(manufacturerSlug, productSlug) {
  const [{ data: product }, { data: brandProducts }] = await Promise.all([
    db().from("products")
      .select(`${PRODUCT_FIELDS_BY_BRAND},
        related:product_related!product_id (
          item:products!related_product_id ( slug, part_number, product_name, status, manufacturer:manufacturers ( slug ) )
        )`)
      .eq("manufacturer.slug", manufacturerSlug).eq("manufacturer.status", "active")
      .eq("slug", productSlug).eq("status", "published")
      .maybeSingle(),
    db().from("products")
      .select("slug, part_number, product_name, manufacturer:manufacturers!inner ( slug )")
      .eq("manufacturer.slug", manufacturerSlug).eq("status", "published"),
  ]);
  if (!product) return null;

  const sorted = [...(brandProducts ?? [])].sort(byPartNumber);
  const idx = sorted.findIndex((p) => p.slug === product.slug);
  const related = (product.related ?? [])
    .map((r) => r.item)
    .filter((item) => item && item.status === "published" && item.manufacturer?.slug);

  return {
    ...product,
    related,
    prev: idx > 0 ? sorted[idx - 1] : null,
    next: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : null,
  };
}

export async function getManufacturer(slug) {
  const [{ data }, { data: products }] = await Promise.all([
    db().from("manufacturers").select("slug, name, description, seo_title, seo_description, website")
      .eq("slug", slug).eq("status", "active").maybeSingle(),
    db().from("products").select(PRODUCT_FIELDS_BY_BRAND)
      .eq("manufacturer.slug", slug).eq("status", "published")
      .order("part_number"),
  ]);
  if (!data) return null;
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
  if (!categorySlug) {
    const { data } = await db().from("products").select(PRODUCT_FIELDS).eq("status", "published").order("part_number");
    return data ?? [];
  }
  const fields = PRODUCT_FIELDS.replace("category:categories ( slug, name )", "category:categories!inner ( slug, name )");
  const { data } = await db().from("products").select(fields)
    .eq("category.slug", categorySlug).eq("status", "published")
    .order("part_number");
  return data ?? [];
}

import { supabase } from "./client";
import { compressImageFile } from "../imageCompression";

async function uploadFile(bucket, file, folder = "") {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${folder ? `${folder}/` : ""}${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImage(file) {
  // Falls back to the original file if compression fails for any reason
  // (e.g. an unusual format canvas can't decode) rather than blocking the upload.
  const compressed = await compressImageFile(file).catch(() => file);
  return uploadFile("product-images", compressed);
}

// Manufacturer logos share the product-images bucket (same public-read,
// admin-write policies) under their own folder. SVGs go up untouched — they
// are already tiny, and rasterising one would only lose sharpness.
export async function uploadManufacturerLogo(file) {
  const isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name);
  const prepared = isSvg
    ? file
    : await compressImageFile(file, { maxDimension: 640, quality: 0.92 }).catch(() => file);
  return uploadFile("product-images", prepared, "logos");
}

// Article images: same bucket and policies, own folder, same compression as
// product photos.
export async function uploadArticleImage(file) {
  const compressed = await compressImageFile(file).catch(() => file);
  return uploadFile("product-images", compressed, "articles");
}

export function uploadDatasheet(file) {
  return uploadFile("datasheets", file);
}

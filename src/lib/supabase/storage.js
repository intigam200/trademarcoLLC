import { supabase } from "./client";
import { compressImageFile } from "../imageCompression";

async function uploadFile(bucket, file) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
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

export function uploadDatasheet(file) {
  return uploadFile("datasheets", file);
}

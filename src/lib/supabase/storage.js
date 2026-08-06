import { supabase } from "./client";

async function uploadFile(bucket, file) {
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function uploadProductImage(file) {
  return uploadFile("product-images", file);
}

export function uploadDatasheet(file) {
  return uploadFile("datasheets", file);
}

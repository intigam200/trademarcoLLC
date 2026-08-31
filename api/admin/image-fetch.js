import { randomUUID } from "crypto";
import sharp from "sharp";
import { verifyAdmin } from "../_lib/verifyAdmin.js";
import { getSupabaseAdmin } from "../_lib/supabaseAdmin.js";

// Downloads an externally-hosted image (picked from image-search results, or
// any direct URL), re-encodes it to a reasonably-sized WebP, and stores it in
// the same product-images bucket manual uploads use. Runs server-side
// because the browser can't reliably fetch an arbitrary third-party image's
// bytes itself (most hosts don't send CORS headers for hotlinking).
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await verifyAdmin(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { url } = req.body || {};
  if (typeof url !== "string" || !url) {
    return res.status(400).json({ error: "Missing image URL." });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: "Invalid URL." });
  }
  if (parsed.protocol !== "https:") {
    return res.status(400).json({ error: "Only https:// image URLs are allowed." });
  }

  try {
    const imgRes = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!imgRes.ok) {
      return res.status(502).json({ error: `Could not download that image (HTTP ${imgRes.status}).` });
    }

    const contentType = imgRes.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return res.status(400).json({ error: "That URL doesn't point to an image." });
    }

    const contentLength = Number(imgRes.headers.get("content-length") || 0);
    if (contentLength && contentLength > MAX_DOWNLOAD_BYTES) {
      return res.status(400).json({ error: "Image is too large (max 20MB)." });
    }

    const arrayBuffer = await imgRes.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_DOWNLOAD_BYTES) {
      return res.status(400).json({ error: "Image is too large (max 20MB)." });
    }

    const webpBuffer = await sharp(Buffer.from(arrayBuffer))
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const supabase = getSupabaseAdmin();
    const path = `${randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(path, webpBuffer, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return res.status(200).json({ url: data.publicUrl });
  } catch (err) {
    console.error("Image fetch/compress failed:", err.message);
    return res.status(502).json({ error: "Couldn't process that image. Try a different result." });
  }
}

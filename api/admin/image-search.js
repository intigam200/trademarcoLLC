import { verifyAdmin } from "../_lib/verifyAdmin.js";

// Searches Google Images for a product photo (via Google's Custom Search
// JSON API) so the admin can pick a result instead of tab-switching to
// google.com and downloading manually. The API key/search engine ID stay
// server-only — the browser only ever talks to this endpoint.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await verifyAdmin(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { query } = req.body || {};
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "Missing search query." });
  }

  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cx = process.env.GOOGLE_CSE_CX;
  if (!apiKey || !cx) {
    return res.status(500).json({ error: "Image search isn't configured yet (missing GOOGLE_CSE_API_KEY / GOOGLE_CSE_CX)." });
  }

  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", query.trim());
  url.searchParams.set("searchType", "image");
  url.searchParams.set("num", "10");
  url.searchParams.set("safe", "active");

  try {
    const apiRes = await fetch(url);
    const data = await apiRes.json();
    if (!apiRes.ok) {
      console.error("Google CSE error:", data.error?.message);
      return res.status(502).json({ error: data.error?.message || "Image search failed." });
    }

    const results = (data.items || []).map((item) => ({
      title: item.title,
      imageUrl: item.link,
      thumbnailUrl: item.image?.thumbnailLink || item.link,
      contextUrl: item.image?.contextLink || item.displayLink,
      width: item.image?.width,
      height: item.image?.height,
    }));

    return res.status(200).json({ results });
  } catch (err) {
    console.error("Image search request failed:", err.message);
    return res.status(502).json({ error: "Image search failed. Please try again." });
  }
}

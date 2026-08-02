import { buildAdminLogoutCookie } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.setHeader("Set-Cookie", buildAdminLogoutCookie());
  return res.status(200).json({ ok: true });
}

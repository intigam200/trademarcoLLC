import bcrypt from "bcryptjs";
import { signAdminSession, buildAdminSessionCookie } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_JWT_SECRET } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !ADMIN_JWT_SECRET) {
    console.error("Admin auth environment variables are not fully configured");
    return res.status(500).json({ error: "Admin login is not configured." });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  // Always run bcrypt.compare, even on an email mismatch, so response timing
  // doesn't leak whether the email was recognized.
  const passwordMatches = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  const emailMatches = email.trim().toLowerCase() === ADMIN_EMAIL.trim().toLowerCase();

  if (!emailMatches || !passwordMatches) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = signAdminSession(ADMIN_EMAIL);
  res.setHeader("Set-Cookie", buildAdminSessionCookie(token));
  return res.status(200).json({ ok: true, email: ADMIN_EMAIL });
}

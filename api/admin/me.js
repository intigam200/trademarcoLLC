import { getAdminSessionFromRequest } from "../_lib/adminAuth.js";

export default async function handler(req, res) {
  const session = getAdminSessionFromRequest(req);
  if (!session) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true, email: session.sub });
}

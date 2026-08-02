import jwt from "jsonwebtoken";

export const ADMIN_COOKIE_NAME = "tm_admin_session";
const SESSION_TTL_SECONDS = 8 * 60 * 60; // 8h

export function signAdminSession(email) {
  return jwt.sign({ sub: email, role: "admin" }, process.env.ADMIN_JWT_SECRET, {
    expiresIn: SESSION_TTL_SECONDS,
  });
}

export function verifyAdminSession(token) {
  try {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
  } catch {
    return null;
  }
}

export function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((pair) => {
      const idx = pair.indexOf("=");
      return [pair.slice(0, idx).trim(), decodeURIComponent(pair.slice(idx + 1))];
    })
  );
}

export function buildAdminSessionCookie(token) {
  const parts = [
    `${ADMIN_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${SESSION_TTL_SECONDS}`,
  ];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function buildAdminLogoutCookie() {
  const parts = [`${ADMIN_COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Strict", "Max-Age=0"];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export function getAdminSessionFromRequest(req) {
  const token = parseCookies(req)[ADMIN_COOKIE_NAME];
  return token ? verifyAdminSession(token) : null;
}

// URL guard for the server-side SEO crawler. The audit only ever requests the
// site's own canonical host over HTTPS, so it can't be pointed at internal
// network addresses, cloud metadata endpoints or other people's sites.

export const AUDIT_HOST = "www.trademarco.com";

export function toAuditUrl(input, base = `https://${AUDIT_HOST}/`) {
  let url;
  try {
    url = new URL(String(input ?? ""), base);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (url.hostname !== AUDIT_HOST) return null;
  if (url.port && url.port !== "443") return null;
  if (url.username || url.password) return null;
  url.hash = "";
  return url;
}

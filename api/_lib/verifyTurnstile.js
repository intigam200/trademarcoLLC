const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// Returns true if the token passes Cloudflare Turnstile verification.
// Gracefully returns true (skips the check) when TURNSTILE_SECRET_KEY isn't
// configured yet, so RFQ submissions keep working — honeypot-protected only
// — until Turnstile is set up. Once the secret is set, a missing/invalid
// token is always rejected.
export async function verifyTurnstile(token, remoteIp) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn("TURNSTILE_SECRET_KEY not set — skipping Turnstile spam verification.");
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    const data = await res.json();
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification request failed:", err);
    return false;
  }
}

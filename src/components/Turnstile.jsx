import { useCallback, useEffect, useRef } from "react";

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptPromise = null;
function loadTurnstileScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) { resolve(window.turnstile); return; }
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(window.turnstile));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// Invisible Cloudflare Turnstile widget. With appearance:"interaction-only"
// it renders nothing visible and solves silently in the background for
// legitimate traffic — Cloudflare only shows a challenge UI on the rare
// visitor it can't otherwise clear. Calls onToken(token) once solved and
// again on refresh/expiry; onToken("") clears a stale token.
//
// If VITE_TURNSTILE_SITE_KEY isn't set, this renders nothing and never
// calls onToken — the form still works (honeypot-only protection) until
// Turnstile keys are configured; see .env.example.
export default function Turnstile({ onToken, resetKey }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const renderWidget = useCallback((turnstile) => {
    if (!containerRef.current || widgetIdRef.current !== null) return;
    widgetIdRef.current = turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      appearance: "interaction-only",
      callback: (token) => onToken(token),
      "expired-callback": () => onToken(""),
      "error-callback": () => onToken(""),
    });
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadTurnstileScript()
      .then((turnstile) => { if (!cancelled) renderWidget(turnstile); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [renderWidget]);

  // Get a fresh token after a failed/retried submission consumes the old one.
  useEffect(() => {
    if (!SITE_KEY || widgetIdRef.current === null || !window.turnstile) return;
    window.turnstile.reset(widgetIdRef.current);
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={containerRef} />;
}

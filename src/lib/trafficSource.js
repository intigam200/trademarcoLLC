// First-touch traffic source for the visit, captured once per browser session
// and attached to RFQ submissions so the SEO Growth Center can count enquiries
// from visits that arrived from a search engine. Stores only the referring
// host (never the full referrer URL), the landing path and any utm_ tags.

const KEY = "tm_landing_source";

const SEARCH_ENGINES = [
  /(^|\.)google\.[a-z.]+$/, /(^|\.)bing\.com$/, /(^|\.)yahoo\.[a-z.]+$/, /(^|\.)duckduckgo\.com$/,
  /(^|\.)yandex\.[a-z.]+$/, /(^|\.)baidu\.com$/, /(^|\.)ecosia\.org$/, /(^|\.)search\.brave\.com$/,
  /(^|\.)naver\.com$/, /(^|\.)seznam\.cz$/,
];

export function isSearchEngineHost(host) {
  const h = String(host ?? "").toLowerCase();
  return !!h && SEARCH_ENGINES.some((re) => re.test(h));
}

export function captureLandingSource() {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(KEY)) return;
    let referrer = null;
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.host !== window.location.host) referrer = ref.host;
    } catch { /* malformed referrer: treat as direct */ }
    const params = new URLSearchParams(window.location.search);
    const value = {
      referrer,
      page: window.location.pathname.slice(0, 300),
      utm_source: params.get("utm_source")?.slice(0, 100) || null,
      utm_medium: params.get("utm_medium")?.slice(0, 100) || null,
      utm_campaign: params.get("utm_campaign")?.slice(0, 100) || null,
    };
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch { /* storage blocked: the RFQ simply goes without a source */ }
}

export function readLandingSource() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "null");
  } catch {
    return null;
  }
}

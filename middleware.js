// Routes crawlers that don't execute JavaScript to the server-rendered
// catalogue in api/render.js.
//
// This lives in middleware rather than a vercel.json rewrite because rewrites
// are evaluated *after* the filesystem: "/" resolves straight to the static
// index.html and never reaches a rewrite rule, which left the home page — the
// one page every crawler starts from — serving an empty shell. Middleware runs
// before the filesystem, so it can intercept every route uniformly.

import { rewrite, next } from "@vercel/edge";

// Googlebot and bingbot execute JavaScript, so they were deliberately left out
// of this list at first. Search Console then reported 193 pages unindexed as
// "Duplicate without user-selected canonical" — Google was clustering all 425
// URLs together, because the pre-JS shell it indexed carries the home page's
// title, 51 words of chrome and no canonical at all. Serving them the same
// server render the AI crawlers get is not cloaking: the facts, the title and
// the canonical are identical to what the SPA produces once JS runs.
// Google-InspectionTool is included so URL Inspection in Search Console shows
// what Googlebot is actually served.
const BOT_PATTERN = /(Googlebot|Google-InspectionTool|Storebot-Google|bingbot|GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|Claude-SearchBot|anthropic-ai|PerplexityBot|Perplexity-User|Google-Extended|Amazonbot|Applebot|Bytespider|CCBot|cohere-ai|DuckAssistBot|meta-externalagent|MistralAI-User|YouBot)/i;

// Only the routes api/render.js knows how to build. Anything else — legal
// pages, /company, the admin panel — falls through to the app untouched.
const RENDERABLE = [
  /^\/$/,
  /^\/products\/?$/,
  /^\/industries\/?$/,
  /^\/manufacturers\/?$/,
  /^\/manufacturers\/[^/]+\/?$/,
  /^\/manufacturers\/[^/]+\/[^/]+\/?$/,
];

export const config = {
  // Skip the API itself, the admin panel and anything with a file extension,
  // so assets never pay the cost of this check.
  matcher: ["/((?!api/|admin|.*\\.[a-zA-Z0-9]+$).*)"],
};

export default function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  if (!BOT_PATTERN.test(userAgent)) return next();

  const url = new URL(request.url);
  if (!RENDERABLE.some((pattern) => pattern.test(url.pathname))) return next();

  const target = new URL("/api/render", url.origin);
  target.searchParams.set("path", url.pathname);
  const category = url.searchParams.get("category");
  if (category) target.searchParams.set("category", category);

  return rewrite(target);
}

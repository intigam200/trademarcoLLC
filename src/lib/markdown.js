// Minimal Markdown → HTML for articles, shared by the React article page, the
// admin preview and api/render.js. Deliberately small and safe rather than
// complete: every character of input is HTML-escaped first, and only the
// constructs below are turned back into markup. Raw HTML in the source is
// never passed through, and links/images only accept http(s), site-relative
// paths, fragments and mailto — so an article can't inject script.
//
// Supported: # to #### headings, paragraphs, **bold**, *italic*, `code`,
// [text](url), ![alt](src), - / * bullet lists, 1. numbered lists,
// > blockquotes, --- rules.

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Undo escapeHtml for a URL that was captured from already-escaped text, so
// it can be validated as the URL the author actually typed.
function unescapeHtml(text) {
  return text.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
}

export function safeUrl(raw, { allowMailto = true } = {}) {
  const url = String(raw ?? "").trim();
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (url.startsWith("#")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (allowMailto && /^mailto:[^\s]+$/i.test(url)) return url;
  return null;
}

export function isInternalHref(href) {
  if (!href) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  return /^https?:\/\/(www\.)?trademarco\.com(\/|$)/i.test(href);
}

function renderInline(escaped) {
  let out = escaped;
  // Images before links: ![alt](src) contains the link pattern.
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (m, alt, src) => {
    const url = safeUrl(unescapeHtml(src), { allowMailto: false });
    if (!url || url.startsWith("#")) return alt;
    return `<img src="${escapeHtml(url)}" alt="${alt}" loading="lazy">`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, href) => {
    const url = safeUrl(unescapeHtml(href));
    if (!url) return text;
    const external = /^https?:\/\//i.test(url) && !isInternalHref(url);
    return `<a href="${escapeHtml(url)}"${external ? ' rel="noopener" target="_blank"' : ""}>${text}</a>`;
  });
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  return out;
}

export function renderMarkdown(source) {
  const lines = String(source ?? "").replace(/\r\n?/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let list = null; // { type: "ul" | "ol", items: [] }
  let quote = [];

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${renderInline(escapeHtml(paragraph.join(" ")))}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (list) html.push(`<${list.type}>${list.items.map((i) => `<li>${renderInline(escapeHtml(i))}</li>`).join("")}</${list.type}>`);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length) html.push(`<blockquote><p>${renderInline(escapeHtml(quote.join(" ")))}</p></blockquote>`);
    quote = [];
  };
  const flushAll = () => { flushParagraph(); flushList(); flushQuote(); };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const quoted = line.match(/^>\s?(.*)$/);

    if (!line.trim()) { flushAll(); continue; }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) { flushAll(); html.push("<hr>"); continue; }
    if (heading) {
      flushAll();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(escapeHtml(heading[2].trim()))}</h${level}>`);
      continue;
    }
    if (bullet || numbered) {
      flushParagraph(); flushQuote();
      const type = bullet ? "ul" : "ol";
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((bullet || numbered)[1]);
      continue;
    }
    if (quoted) { flushParagraph(); flushList(); quote.push(quoted[1]); continue; }
    flushList(); flushQuote();
    paragraph.push(line.trim());
  }
  flushAll();
  return html.join("\n");
}

// Structural facts the content checklist and link assistant work from.
export function analyzeMarkdown(source) {
  const text = String(source ?? "");
  const headings = [...text.matchAll(/^(#{1,4})\s+(.+)$/gm)].map((m) => ({ level: m[1].length, text: m[2].trim() }));
  const images = [...text.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)].map((m) => ({ alt: m[1].trim(), src: m[2] }));
  const links = [...text.replace(/!\[[^\]]*\]\([^)\s]+\)/g, "").matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)]
    .map((m) => ({ text: m[1].trim(), href: m[2], internal: isInternalHref(m[2]) }));
  const plain = text
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,4}\s+/gm, "")
    .replace(/[*`>#-]/g, " ");
  const words = plain.split(/\s+/).filter(Boolean);
  const firstParagraph = text.split(/\n\s*\n/).map((b) => b.trim()).find((b) => b && !/^(#|!\[|[-*]\s|\d+[.)]\s|>)/.test(b)) || "";
  return { headings, images, links, plainText: words.join(" "), wordCount: words.length, firstParagraph };
}

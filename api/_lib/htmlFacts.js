// Extracts the SEO-relevant facts from a page's HTML. Regex-based on purpose:
// it only has to read the markup this site produces (api/render.js and the
// SPA shell), and it avoids shipping an HTML parser to a serverless function.

function decode(s) {
  return String(s ?? "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

function attr(tag, name) {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return m ? decode(m[2] ?? m[3] ?? m[4] ?? "") : null;
}

function metaContent(html, key, value) {
  for (const m of html.matchAll(/<meta\b[^>]*>/gi)) {
    if ((attr(m[0], key) || "").toLowerCase() === value) return attr(m[0], "content");
  }
  return null;
}

export function extractHtmlFacts(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? html;
  const titles = [...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => decode(m[1]));
  const canonicals = [...head.matchAll(/<link\b[^>]*>/gi)]
    .filter((m) => (attr(m[0], "rel") || "").toLowerCase().split(/\s+/).includes("canonical"))
    .map((m) => attr(m[0], "href"));
  const body = html.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
  const h1s = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => decode(m[1].replace(/<[^>]+>/g, " ")));
  const links = [...body.matchAll(/<a\b[^>]*>/gi)].map((m) => attr(m[0], "href")).filter(Boolean);
  const images = [...body.matchAll(/<img\b[^>]*>/gi)].map((m) => ({ src: attr(m[0], "src"), alt: attr(m[0], "alt") }));

  const jsonLd = [];
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : data["@graph"] ? data["@graph"] : [data];
      jsonLd.push({ valid: true, types: nodes.map((n) => n?.["@type"]).filter(Boolean) });
    } catch (err) {
      jsonLd.push({ valid: false, error: err.message });
    }
  }

  const text = decode(body.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
  return {
    titles,
    description: metaContent(head, "name", "description"),
    robots: metaContent(head, "name", "robots"),
    canonicals,
    h1s,
    links,
    images,
    jsonLd,
    wordCount: text ? text.split(" ").length : 0,
  };
}

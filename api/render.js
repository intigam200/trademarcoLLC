import { getProduct, getManufacturer, listManufacturers, listCategories, listProducts } from "./_lib/catalogData.js";

// Server-rendered HTML for crawlers that don't run JavaScript.
//
// The site is a client-rendered SPA, so a plain fetch of any catalogue URL
// returns the empty app shell with the home page's title — nothing about the
// product. Googlebot renders JS and eventually sees the real page, but the AI
// crawlers (GPTBot, ClaudeBot, PerplexityBot and friends) generally do not,
// which means the entire catalogue is invisible to them.
//
// vercel.json routes only those user agents here. The markup below carries the
// same facts the React page shows — same names, descriptions, applications,
// datasheet links — just without the styling, so this stays a rendering
// workaround rather than serving crawlers different content than visitors.

const SITE_URL = process.env.SITE_URL || "https://www.trademarco.com";
const ORG_NAME = "Trademarco Global";
const ORG_LEGAL_NAME = "TRADEMARCO LLC";

function esc(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// JSON-LD sits inside a <script>, so the one sequence that must never survive
// is a closing tag; escaping "<" wholesale would corrupt the JSON.
function jsonLd(data) {
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

const organization = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: ORG_NAME,
  legalName: ORG_LEGAL_NAME,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/images/products/logo.png`,
  email: "info@trademarco.com",
  telephone: "+1-307-999-8667",
  address: {
    "@type": "PostalAddress",
    streetAddress: "30 N Gould St Ste N",
    addressLocality: "Sheridan",
    addressRegion: "WY",
    postalCode: "82801",
    addressCountry: "US",
  },
  sameAs: ["https://www.linkedin.com/company/trademarco-llc/"],
};

function breadcrumb(trail) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      ...(step.path ? { item: `${SITE_URL}${step.path}` } : {}),
    })),
  };
}

function page({ path, title, description, blocks, schemas = [] }) {
  const graph = { "@context": "https://schema.org", "@graph": [organization, ...schemas] };
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE_URL}${path}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE_URL}${path}">
${jsonLd(graph)}
</head>
<body>
<header><a href="/">${ORG_NAME}</a></header>
<main>
${blocks}
</main>
<footer>
<p>${ORG_LEGAL_NAME} — 30 N Gould St Ste N, Sheridan, WY 82801, USA. info@trademarco.com · +1 (307) 999-8667</p>
<nav><a href="/products">Products</a> · <a href="/manufacturers">Manufacturers</a> · <a href="/industries">Industries</a> · <a href="/company">Company</a></nav>
</footer>
</body>
</html>`;
}

function productList(products, { heading }) {
  if (!products.length) return `<h2>${esc(heading)}</h2><p>No products published yet.</p>`;
  const items = products.map((p) => {
    const url = `/manufacturers/${p.manufacturer?.slug}/${p.slug}`;
    const label = [p.manufacturer?.name, p.part_number, p.product_name].filter(Boolean).join(" ");
    return `<li><a href="${esc(url)}">${esc(label)}</a>${p.short_description ? ` — ${esc(p.short_description)}` : ""}</li>`;
  }).join("\n");
  return `<h2>${esc(heading)} (${products.length})</h2>\n<ul>\n${items}\n</ul>`;
}

async function renderProduct(manufacturerSlug, productSlug) {
  const product = await getProduct(manufacturerSlug, productSlug);
  if (!product) return null;

  const path = `/manufacturers/${manufacturerSlug}/${productSlug}`;
  const manufacturerName = product.manufacturer?.name ?? "";
  const label = [manufacturerName, product.part_number, product.product_name].filter(Boolean).join(" ");
  const title = product.seo_title || `${label} | ${ORG_NAME}`;
  const description = product.seo_description || product.short_description
    || `Request a quote for ${label} from ${ORG_NAME}.`;

  const applications = Array.isArray(product.applications) ? product.applications : [];
  const industries = Array.isArray(product.industries) ? product.industries : [];

  const blocks = [
    `<h1>${esc(product.product_name)}</h1>`,
    `<p><strong>Manufacturer:</strong> ${esc(manufacturerName)}${product.series ? ` — ${esc(product.series)}` : ""}</p>`,
    product.part_number ? `<p><strong>Part number:</strong> ${esc(product.part_number)}</p>` : "",
    product.category?.name ? `<p><strong>Category:</strong> <a href="/products?category=${esc(product.category.slug)}">${esc(product.category.name)}</a></p>` : "",
    product.short_description ? `<p>${esc(product.short_description)}</p>` : "",
    product.long_description ? `<h2>Description</h2><p>${esc(product.long_description)}</p>` : "",
    applications.length ? `<h2>Applications</h2><ul>${applications.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : "",
    industries.length ? `<h2>Industries</h2><ul>${industries.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "",
    product.datasheet_url ? `<p><a href="${esc(product.datasheet_url)}">Manufacturer datasheet</a></p>` : "",
    product.rfq_available ? `<p>Available on request — pricing is quoted per enquiry. <a href="/#contact">Request a quotation</a>.</p>` : "",
    `<p><a href="/manufacturers/${esc(manufacturerSlug)}">All ${esc(manufacturerName)} products</a></p>`,
  ].filter(Boolean).join("\n");

  const productSchema = {
    "@type": "Product",
    "@id": `${SITE_URL}${path}#product`,
    name: product.product_name,
    url: `${SITE_URL}${path}`,
    description: product.short_description || product.long_description || undefined,
    sku: product.part_number || undefined,
    mpn: product.part_number || undefined,
    image: product.image_url || undefined,
    category: product.category?.name || undefined,
    brand: manufacturerName ? { "@type": "Brand", name: manufacturerName } : undefined,
    manufacturer: manufacturerName ? { "@type": "Organization", name: manufacturerName } : undefined,
    // No price is published anywhere in the catalogue — this is a
    // request-for-quote business — so the Offer states who sells it and that
    // it is offered for sale, and omits price rather than inventing one.
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}${path}`,
      businessFunction: "http://purl.org/goodrelations/v1#Sell",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
  };

  return page({
    path, title, description, blocks,
    schemas: [
      productSchema,
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Manufacturers", path: "/manufacturers" },
        { name: manufacturerName, path: `/manufacturers/${manufacturerSlug}` },
        { name: product.product_name },
      ]),
    ],
  });
}

async function renderManufacturer(slug) {
  const manufacturer = await getManufacturer(slug);
  if (!manufacturer) return null;

  const path = `/manufacturers/${slug}`;
  const title = manufacturer.seo_title || `${manufacturer.name} Industrial Products | ${ORG_NAME}`;
  const description = manufacturer.seo_description || manufacturer.description
    || `${manufacturer.name} industrial products supplied worldwide by ${ORG_NAME}.`;

  const blocks = [
    `<h1>${esc(manufacturer.name)}</h1>`,
    manufacturer.description ? `<p>${esc(manufacturer.description)}</p>` : "",
    productList(manufacturer.products, { heading: `${manufacturer.name} products` }),
  ].filter(Boolean).join("\n");

  return page({
    path, title, description, blocks,
    schemas: [
      {
        "@type": "CollectionPage",
        name: `${manufacturer.name} products`,
        url: `${SITE_URL}${path}`,
        about: { "@type": "Brand", name: manufacturer.name },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: manufacturer.products.length,
          itemListElement: manufacturer.products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/manufacturers/${slug}/${p.slug}`,
            name: [p.part_number, p.product_name].filter(Boolean).join(" "),
          })),
        },
      },
      breadcrumb([
        { name: "Home", path: "/" },
        { name: "Manufacturers", path: "/manufacturers" },
        { name: manufacturer.name },
      ]),
    ],
  });
}

async function renderManufacturerIndex() {
  const manufacturers = await listManufacturers();
  const blocks = [
    `<h1>Industrial Equipment Manufacturers</h1>`,
    `<p>Brands sourced by ${ORG_NAME} — automation, valves, instrumentation, electrical equipment and spare parts.</p>`,
    `<ul>${manufacturers.map((m) => `<li><a href="/manufacturers/${esc(m.slug)}">${esc(m.name)}</a>${m.description ? ` — ${esc(m.description)}` : ""}</li>`).join("\n")}</ul>`,
    `<p>All manufacturer names, trademarks and logos are the property of their respective owners. ${ORG_LEGAL_NAME} is an independent industrial sourcing company and is not an authorized distributor or representative of the manufacturers listed unless otherwise stated.</p>`,
  ].join("\n");

  return page({
    path: "/manufacturers",
    title: `Industrial Equipment Manufacturers | ${ORG_NAME}`,
    description: `Browse industrial equipment manufacturers and brands sourced by ${ORG_NAME} — automation, valves, instrumentation, electrical equipment and more.`,
    blocks,
    schemas: [
      {
        "@type": "CollectionPage",
        name: "Industrial Equipment Manufacturers",
        url: `${SITE_URL}/manufacturers`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: manufacturers.length,
          itemListElement: manufacturers.map((m, i) => ({
            "@type": "ListItem", position: i + 1, name: m.name, url: `${SITE_URL}/manufacturers/${m.slug}`,
          })),
        },
      },
      breadcrumb([{ name: "Home", path: "/" }, { name: "Manufacturers" }]),
    ],
  });
}

async function renderProducts(categorySlug) {
  const [categories, products] = await Promise.all([listCategories(), listProducts({ categorySlug })]);
  const active = categorySlug ? categories.find((c) => c.slug === categorySlug) : null;
  if (categorySlug && !active) return null;

  const path = active ? `/products?category=${active.slug}` : "/products";
  const title = active ? `${active.name} | Industrial Products | ${ORG_NAME}` : `Industrial Equipment & Components | ${ORG_NAME}`;
  const description = active
    ? (active.full_description || active.description || `Browse ${active.name} supplied by ${ORG_NAME}.`)
    : `Browse industrial equipment and components sourced from qualified manufacturers worldwide by ${ORG_NAME}.`;

  const blocks = [
    `<h1>${esc(active ? active.name : "Industrial Equipment & Components")}</h1>`,
    `<p>${esc(description)}</p>`,
    active && Array.isArray(active.types) && active.types.length
      ? `<h2>Types</h2><ul>${active.types.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : "",
    `<h2>Product categories</h2><ul>${categories.map((c) => `<li><a href="/products?category=${esc(c.slug)}">${esc(c.name)}</a>${c.description ? ` — ${esc(c.description)}` : ""}</li>`).join("\n")}</ul>`,
    productList(products, { heading: active ? `${active.name} products` : "All products" }),
  ].filter(Boolean).join("\n");

  return page({
    path, title, description, blocks,
    schemas: [
      {
        "@type": "CollectionPage",
        name: active ? active.name : "Industrial Equipment & Components",
        url: `${SITE_URL}${path}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: products.length,
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: [p.manufacturer?.name, p.part_number, p.product_name].filter(Boolean).join(" "),
            url: `${SITE_URL}/manufacturers/${p.manufacturer?.slug}/${p.slug}`,
          })),
        },
      },
      breadcrumb(
        active
          ? [{ name: "Home", path: "/" }, { name: "Products", path: "/products" }, { name: active.name }]
          : [{ name: "Home", path: "/" }, { name: "Products" }]
      ),
    ],
  });
}

async function renderHome() {
  const [categories, manufacturers] = await Promise.all([listCategories(), listManufacturers()]);
  const blocks = [
    `<h1>Industrial Equipment &amp; Parts — Worldwide</h1>`,
    `<p>${ORG_NAME} (${ORG_LEGAL_NAME}) is a US-registered industrial sourcing and procurement company based in Sheridan, Wyoming. We source industrial equipment and components from qualified manufacturers worldwide — with competitive pricing, quality control and reliable supply support. Pricing is quoted per enquiry.</p>`,
    `<h2>Product categories</h2><ul>${categories.map((c) => `<li><a href="/products?category=${esc(c.slug)}">${esc(c.name)}</a>${c.description ? ` — ${esc(c.description)}` : ""}</li>`).join("\n")}</ul>`,
    `<h2>Manufacturers</h2><ul>${manufacturers.map((m) => `<li><a href="/manufacturers/${esc(m.slug)}">${esc(m.name)}</a></li>`).join("\n")}</ul>`,
    `<h2>Industries served</h2><ul>${["Oil &amp; Gas", "Petrochemical", "Mining", "Marine", "Energy", "Manufacturing"].map((i) => `<li>${i}</li>`).join("")}</ul>`,
    `<h2>Supply regions</h2><ul><li>North America — USA, Canada, Mexico</li><li>Europe — Germany, Italy, UK, Spain</li><li>Middle East — UAE, Saudi Arabia, Turkey</li><li>Asia-Pacific — China, India, South Korea, Japan</li></ul>`,
  ].join("\n");

  return page({
    path: "/",
    title: `${ORG_NAME} | Industrial Automation & Process Equipment Supplier`,
    description: `${ORG_NAME} supplies industrial automation, control valves, instrumentation, electrical equipment and spare parts worldwide. Request a quotation today.`,
    blocks,
    schemas: [
      { "@type": "WebSite", url: `${SITE_URL}/`, name: ORG_NAME, publisher: { "@id": `${SITE_URL}/#organization` } },
      breadcrumb([{ name: "Home" }]),
    ],
  });
}

async function renderIndustries() {
  const blocks = [
    `<h1>Industries We Serve</h1>`,
    `<p>${ORG_NAME} supplies industrial equipment and spare parts into oil &amp; gas, petrochemical, mining, marine, energy and manufacturing operations.</p>`,
    `<ul>
      <li><strong>Oil &amp; Gas</strong> — upstream, midstream and downstream operations. Control valves, safety / relief valves, pressure transmitters, flow meters, filter elements.</li>
      <li><strong>Petrochemical</strong> — refineries and chemical processing plants. Globe valves, butterfly valves, coalescing filters, temperature instruments, seals and gaskets.</li>
      <li><strong>Mining</strong> — mineral processing and extraction facilities. Gate valves, Y-strainers, electric motors, bearings, replacement parts.</li>
      <li><strong>Marine</strong> — shipbuilding, offshore and port infrastructure. Butt weld fittings, flanges, check valves, switchgear, pump components.</li>
      <li><strong>Energy</strong> — power generation and renewable energy. Control panels, drives, pressure gauges, level instruments, valve components.</li>
      <li><strong>Manufacturing</strong> — heavy industry and production facilities. Automation components, industrial controls, motor starters, fasteners, OEM / equivalent parts.</li>
    </ul>`,
  ].join("\n");

  return page({
    path: "/industries",
    title: `Industries We Serve | ${ORG_NAME}`,
    description: "Industrial sourcing for oil & gas, petrochemical, mining, marine, energy and manufacturing — valves, instrumentation, electrical equipment, pipes, filters and spare parts supplied worldwide.",
    blocks,
    schemas: [breadcrumb([{ name: "Home", path: "/" }, { name: "Industries" }])],
  });
}

export default async function handler(req, res) {
  // vercel.json passes the original path through; fall back to the raw URL so
  // the function is still usable when hit directly.
  const raw = typeof req.query.path === "string" && req.query.path ? req.query.path : "/";
  const [pathname] = raw.split("?");
  const segments = pathname.split("/").filter(Boolean);
  const category = typeof req.query.category === "string" ? req.query.category : null;

  try {
    let html = null;

    if (segments.length === 0) {
      html = await renderHome();
    } else if (segments[0] === "products" && segments.length === 1) {
      html = await renderProducts(category);
    } else if (segments[0] === "industries" && segments.length === 1) {
      html = await renderIndustries();
    } else if (segments[0] === "manufacturers") {
      if (segments.length === 1) html = await renderManufacturerIndex();
      else if (segments.length === 2) html = await renderManufacturer(segments[1]);
      else if (segments.length === 3) html = await renderProduct(segments[1], segments[2]);
    }

    if (!html) {
      // Anything else (legal pages, company, a URL that no longer resolves) is
      // left to the SPA rather than served a half-rendered stub.
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Prerender", "passthrough");
      return res.status(404).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Not found | ${ORG_NAME}</title><meta name="robots" content="noindex"></head><body><h1>Not found</h1><p><a href="/">${ORG_NAME}</a></p></body></html>`);
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("X-Prerender", "bot");
    return res.status(200).send(html);
  } catch (err) {
    console.error("Bot render failed for", pathname, err.message);
    return res.status(500).send("Render failed.");
  }
}

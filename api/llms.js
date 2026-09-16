import { listManufacturers, listCategories, listProducts } from "./_lib/catalogData.js";

const SITE_URL = process.env.SITE_URL || "https://www.trademarco.com";

// /llms.txt — a plain-language summary of the catalogue for AI crawlers and
// assistants. Generated from Supabase rather than hand-written so the brand
// and category lists can't drift from what the site actually carries.
export default async function handler(req, res) {
  try {
    const [manufacturers, categories, products] = await Promise.all([
      listManufacturers(), listCategories(), listProducts(),
    ]);

    const withProducts = new Map();
    products.forEach((p) => {
      const name = p.manufacturer?.name;
      if (name) withProducts.set(name, (withProducts.get(name) ?? 0) + 1);
    });

    const body = `# Trademarco Global (TRADEMARCO LLC)

> US-registered industrial sourcing and procurement company supplying industrial
> automation, process equipment, instrumentation, electrical equipment, pipes and
> fittings, filtration and spare parts to industrial operators worldwide.

## About

- Legal name: TRADEMARCO LLC
- Trading name: Trademarco Global
- Entity: Wyoming Limited Liability Company, formed 23 July 2026
- Address: 30 N Gould St Ste N, Sheridan, WY 82801, USA
- Contact: info@trademarco.com · sales@trademarco.com · +1 (307) 999-8667
- Website: ${SITE_URL}

Trademarco Global is an independent sourcing company. It is not an authorised
distributor or representative of the manufacturers listed below unless stated
otherwise on the relevant page. Equivalent and replacement parts are sourced
where an original is discontinued or long-lead.

## Commercial model

Prices are not published. Every enquiry is handled as a request for quotation
(RFQ): the customer submits a specification or part number and receives sourcing
options, pricing and lead times in reply. Quotes are typically returned within
24-48 hours. Any product page can be used to start an RFQ.

## Product categories

${categories.map((c) => {
  const types = Array.isArray(c.types) && c.types.length ? `\n  Types: ${c.types.join(", ")}` : "";
  return `- [${c.name}](${SITE_URL}/products?category=${c.slug}) — ${c.description || ""}${types}`;
}).join("\n")}

## Manufacturers and brands

${manufacturers.map((m) => {
  const count = withProducts.get(m.name);
  return `- [${m.name}](${SITE_URL}/manufacturers/${m.slug})${count ? ` — ${count} product${count === 1 ? "" : "s"} listed` : ""}`;
}).join("\n")}

Catalogue currently lists ${products.length} published products.

## Industries served

- Oil & Gas — upstream, midstream and downstream operations
- Petrochemical — refineries and chemical processing plants
- Mining — mineral processing and extraction facilities
- Marine — shipbuilding, offshore and port infrastructure
- Energy — power generation and renewable energy
- Manufacturing — heavy industry and production facilities

## Supply regions

- North America — USA, Canada, Mexico
- Europe — Germany, Italy, United Kingdom, Spain
- Middle East — UAE, Saudi Arabia, Turkey
- Asia-Pacific — China, India, South Korea, Japan

## Key pages

- [Home](${SITE_URL}/)
- [Product catalogue](${SITE_URL}/products)
- [Manufacturers](${SITE_URL}/manufacturers)
- [Industries](${SITE_URL}/industries)
- [Company](${SITE_URL}/company)
- [Sitemap](${SITE_URL}/sitemap.xml)

## Notes for crawlers

Product pages live at ${SITE_URL}/manufacturers/{manufacturer-slug}/{product-slug}
and are listed in full in the sitemap. The site is a client-rendered
application; crawlers that do not execute JavaScript are served a
server-rendered HTML version of the same content automatically.
`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).send(body);
  } catch (err) {
    console.error("llms.txt generation failed:", err.message);
    return res.status(500).send("Could not generate llms.txt.");
  }
}

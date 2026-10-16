// Builds a structured content brief from the editor's inputs and the real
// catalogue. Template-based and deterministic — there is no language model
// behind it — so every suggestion traces back to an input field or a catalogue
// record. Internal-link suggestions are real URLs only.

import { truncateAtWord, ORG_NAME, TITLE_MAX, DESCRIPTION_MAX } from "../seoMeta.js";
import { productUrl, partFamily } from "./linking.js";

export const INTENTS = {
  informational: "Informational — the reader wants to understand something",
  commercial: "Commercial investigation — the reader is comparing options before buying",
  transactional: "Transactional — the reader is ready to source a specific item",
};

export const AUDIENCES = ["Procurement managers", "Engineers", "Maintenance teams", "Industrial buyers"];

export const CONTENT_TYPES = ["Guide", "Comparison", "Selection checklist", "Troubleshooting", "Replacement / cross-reference", "Industry application"];

const OUTLINES = {
  Guide: ["What it is and where it is used", "How it works", "Key specifications to check", "Common applications", "Sourcing considerations"],
  Comparison: ["What is being compared and why it matters", "Side-by-side: key differences", "When to choose each option", "Compatibility and replacement notes", "Sourcing considerations"],
  "Selection checklist": ["Operating conditions to define first", "Specifications that drive the choice", "Materials and ratings", "Mistakes to avoid", "What to include in your RFQ"],
  Troubleshooting: ["Symptoms", "Likely causes", "Checks before replacing parts", "Replacement parts and part numbers", "When to source a replacement"],
  "Replacement / cross-reference": ["Identifying the original part", "Discontinued and superseded models", "Equivalent and replacement options", "Verifying compatibility", "Requesting a quote for a replacement"],
  "Industry application": ["Operating environment and challenges", "Equipment typically specified", "Standards and requirements to consider", "Maintenance and spares", "Sourcing for this sector"],
};

const QUESTIONS = {
  informational: ["What is it, in plain terms?", "Where and why is it used?", "Which specifications matter most, and why?"],
  commercial: ["How do the options differ in practice?", "Which option suits which operating conditions?", "What does a buyer need to confirm before ordering?"],
  transactional: ["Which exact part numbers apply?", "What information is needed for an accurate quotation?", "Are there equivalent or replacement parts if the original is unavailable?"],
};

function titleCase(s) {
  return String(s ?? "").trim().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function queryVariations(query, { manufacturer, category }) {
  const q = query.trim().toLowerCase();
  const out = new Set();
  if (manufacturer && !q.includes(manufacturer.name.toLowerCase())) out.add(`${manufacturer.name.toLowerCase()} ${q}`);
  if (category && !q.includes(category.name.toLowerCase())) out.add(`${q} ${category.name.toLowerCase()}`);
  out.add(`${q} specifications`);
  out.add(`${q} replacement`);
  out.add(`${q} supplier`);
  return [...out].filter((v) => v !== q).slice(0, 6);
}

// inputs: { query, intent, audience, contentType, manufacturerId, categoryId,
//           productIds, region, relatedArticleIds, sources, outcome }
// catalog: { products, manufacturers, categories, articles }
export function buildBrief(inputs, catalog) {
  const query = (inputs.query || "").trim();
  const manufacturer = catalog.manufacturers.find((m) => m.id === inputs.manufacturerId) || null;
  const category = catalog.categories.find((c) => c.id === inputs.categoryId) || null;
  const chosen = catalog.products.filter((p) => (inputs.productIds || []).includes(p.id));

  // Products to link: the ones chosen, then same brand/category matches whose
  // name or part number shares words with the query.
  const qWords = query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const scored = catalog.products
    .filter((p) => p.status === "published" && !chosen.includes(p))
    .filter((p) => (!manufacturer || p.manufacturer_id === manufacturer.id) && (!category || p.category_id === category.id))
    .map((p) => {
      const hay = `${p.part_number} ${p.product_name} ${p.series ?? ""}`.toLowerCase();
      return { p, score: qWords.filter((w) => hay.includes(w)).length };
    })
    .filter((x) => x.score > 0 || manufacturer || category)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.p);
  const productLinks = [...chosen, ...scored].map((p) => ({
    href: productUrl(p),
    label: `${p.manufacturer?.name ?? ""} ${p.part_number} — ${p.product_name}`.trim(),
    reason: chosen.includes(p) ? "Selected for this brief" : manufacturer && category ? `Same brand and category` : manufacturer ? `Same brand` : category ? `Same category` : "Matches the query",
  }));

  const pageLinks = [];
  if (manufacturer) pageLinks.push({ href: `/manufacturers/${manufacturer.slug}`, label: `${manufacturer.name} products`, reason: "Brand page for the selected manufacturer" });
  if (category) pageLinks.push({ href: `/products?category=${category.slug}`, label: category.name, reason: "Category page for the selected category" });

  const relatedArticles = catalog.articles.filter((a) => (inputs.relatedArticleIds || []).includes(a.id));
  const overlap = catalog.articles.filter((a) => (a.primary_query || "").trim().toLowerCase() === query.toLowerCase());

  const contentType = inputs.contentType && OUTLINES[inputs.contentType] ? inputs.contentType : "Guide";
  const subject = titleCase(query) || "Untitled";
  const proposedTitle = contentType === "Comparison" ? `${subject}: Key Differences and How to Choose`
    : contentType === "Selection checklist" ? `How to Select ${subject}: A Buyer's Checklist`
      : contentType === "Troubleshooting" ? `${subject}: Common Problems and Fixes`
        : contentType === "Replacement / cross-reference" ? `${subject}: Replacements and Equivalents`
          : contentType === "Industry application" ? `${subject}${inputs.region ? ` in ${inputs.region}` : ""}: Application Guide`
            : `${subject}: A Practical Guide`;

  const partNumbersToVerify = chosen.map((p) => p.part_number);
  const facts = [
    ...partNumbersToVerify.map((pn) => `Model / part number ${pn} — confirm against the manufacturer's current documentation`),
    "Every specification figure (pressure, temperature, size, rating) — cite the datasheet it came from",
    "Any statement about compatibility, interchangeability or replacement",
    "Any reference to a standard (API, ASME, IEC, ISO) — cite the standard's clause",
  ];

  return {
    generatedAt: new Date().toISOString(),
    method: "Template-based: built from the brief inputs and catalogue records. Not AI-generated; review and edit every suggestion.",
    query,
    proposedTitle,
    variations: query ? queryVariations(query, { manufacturer, category }) : [],
    intent: inputs.intent || "informational",
    intentLabel: INTENTS[inputs.intent] || INTENTS.informational,
    audience: inputs.audience || AUDIENCES[0],
    audienceNeeds: inputs.audience === "Procurement managers" ? "Part identification, alternatives if unavailable, what to send for a quotation."
      : inputs.audience === "Maintenance teams" ? "Symptoms, replacement parts, how to confirm the right spare."
        : inputs.audience === "Engineers" ? "Specifications, operating limits, selection criteria, standards."
          : "Clear identification of the item and a straightforward way to request a quote.",
    outline: [
      { level: 2, text: OUTLINES[contentType][0] },
      ...OUTLINES[contentType].slice(1).map((text) => ({ level: 2, text })),
      { level: 2, text: "Frequently asked questions" },
    ],
    questions: QUESTIONS[inputs.intent] || QUESTIONS.informational,
    factsToVerify: facts,
    sourceRequirements: [
      "Manufacturer datasheets, manuals or product pages for every specification",
      "The relevant standard for any compliance statement",
      ...(inputs.sources || []).filter(Boolean).map((s) => `Provided: ${s}`),
    ],
    internalLinks: [...pageLinks, ...productLinks],
    relatedArticles: relatedArticles.map((a) => ({ href: `/articles/${a.slug}`, label: a.title })),
    overlapWarning: overlap.length ? `Existing article(s) already target “${query}”: ${overlap.map((a) => a.title).join("; ")}. Consider updating that article instead.` : null,
    cta: inputs.intent === "transactional"
      ? "Request a quotation for the specific part numbers — link to the product page and /#contact."
      : inputs.intent === "commercial"
        ? "Invite readers to send their requirements for a sourcing recommendation — link to /#contact."
        : "Point readers to the relevant category or brand page, with a quote request as the secondary action.",
    metaTitle: `${proposedTitle} | ${ORG_NAME}`.length <= TITLE_MAX ? `${proposedTitle} | ${ORG_NAME}` : truncateAtWord(proposedTitle, TITLE_MAX),
    metaDescription: truncateAtWord(
      `${subject}${manufacturer ? ` (${manufacturer.name})` : ""}: ${OUTLINES[contentType].slice(0, 3).join(", ").toLowerCase()}. ${inputs.outcome ? inputs.outcome : "Request a quotation from Trademarco Global."}`,
      DESCRIPTION_MAX,
    ),
    outcome: inputs.outcome || "",
    region: inputs.region || "",
    partFamilies: [...new Set(chosen.map((p) => partFamily(p.part_number)).filter(Boolean))],
  };
}

// Markdown skeleton for a new draft created from a brief.
export function briefToDraft(brief) {
  const lines = [
    `> Draft created from a template-based brief. Replace every bracketed note with verified content before publishing.`,
    "",
    `[Opening paragraph: answer “${brief.query}” directly in two or three sentences.]`,
    "",
  ];
  for (const h of brief.outline) {
    lines.push(`${"#".repeat(h.level)} ${h.text}`, "", "[Write this section. Cite sources for any figures.]", "");
  }
  if (brief.internalLinks.length) {
    lines.push("## Related products and pages", "");
    for (const l of brief.internalLinks.slice(0, 6)) lines.push(`- [${l.label}](${l.href})`);
    lines.push("");
  }
  lines.push(`[Call to action: ${brief.cta}]`, "", "[Request a quotation](/#contact)");
  return lines.join("\n");
}

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { findUnresolvedNotes, evaluateArticle } from "../src/lib/seoAudit/contentChecklist.js";
import { buildBrief, briefToDraft } from "../src/lib/seoAudit/briefBuilder.js";

const fixture = (name) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

// Catalogue records as they exist for the Rosemount 3095MFA brief.
const emerson = { id: "m-emerson", slug: "emerson", name: "Emerson", status: "active" };
const instrumentation = { id: "c-inst", slug: "instrumentation", name: "Instrumentation", status: "active" };
const product = (part, name) => ({
  id: `p-${part}`, part_number: part, slug: part.toLowerCase(), product_name: name, status: "published",
  manufacturer_id: emerson.id, category_id: instrumentation.id, manufacturer: { slug: "emerson", name: "Emerson" },
});
const products = [
  product("3095MFA", "Rosemount 3095MFA Mass Flowmeter"),
  product("3051SFA", "Rosemount 3051SFA Annubar Flowmeter"),
  product("3051CFA", "Rosemount 3051CFA Annubar Flowmeter"),
  product("2051CFC", "Rosemount 2051CFC Compact Orifice Flowmeter"),
];
const catalog = { products, manufacturers: [emerson], categories: [instrumentation], articles: [] };

describe("Rosemount 3095MFA — unresolved template notes", () => {
  it("finds all 9 notes in the stored draft, with exact lines and text", () => {
    const notes = findUnresolvedNotes({ body_md: fixture("rosemount-3095mfa-draft.md") });
    expect(notes).toHaveLength(9);
    expect(notes.map((n) => n.line)).toEqual([1, 3, 7, 11, 15, 19, 23, 27, 38]);
    expect(notes[0].reason).toBe("Template banner from the brief");
    expect(notes[1].text).toMatch(/^\[Opening paragraph:/);
    expect(notes[2].text).toBe("[Write this section. Cite sources for any figures.]");
    expect(notes[8].text).toMatch(/^\[Call to action:/);
    // The real links in the draft are not notes.
    expect(notes.some((n) => /Request a quotation|Emerson products/.test(n.text))).toBe(false);
  });

  it("finds the same notes in a draft generated from the 3095MFA brief", () => {
    const brief = buildBrief({
      query: "Rosemount 3095MFA Mass Flowmeter", intent: "commercial", audience: "Engineers", contentType: "Guide",
      manufacturerId: emerson.id, categoryId: instrumentation.id, productIds: ["p-3051CFA", "p-3051SFA", "p-3095MFA"],
    }, catalog);
    const notes = findUnresolvedNotes({ body_md: briefToDraft(brief) });
    expect(notes).toHaveLength(9);
    // A pasted page title loses its site-name segments.
    const pasted = buildBrief({ query: "Rosemount 3095MFA Mass Flowmeter | Emerson | Trademarco" }, catalog);
    expect(pasted.query).toBe("Rosemount 3095MFA Mass Flowmeter");
    expect(pasted.proposedTitle).not.toMatch(/\|/);
    expect(notes.filter((n) => n.text.startsWith("[Write this section"))).toHaveLength(6);
  });

  it("passes the completed article: no notes left, legitimate parentheses and links kept", () => {
    const body = fixture("rosemount-3095mfa.md");
    expect(body).toContain("(19 mm)");
    expect(body).toContain("[Request a quotation](/#contact)");
    expect(findUnresolvedNotes({ body_md: body })).toEqual([]);

    const result = evaluateArticle({
      id: "a1", slug: "rosemount-3095mfa-mass-flowmeter", title: "Rosemount 3095MFA Mass Flowmeter: A Practical Guide",
      primary_query: "Rosemount 3095MFA", body_md: body, sources: [{ url: "https://www.emerson.com/x.pdf" }],
    }, catalog);
    const placeholder = result.checks.find((c) => c.id === "placeholders");
    expect(placeholder.state).toBe("pass");
    expect(placeholder.items).toEqual([]);
    expect(result.checks.find((c) => c.id === "internal_links").state).toBe("pass");
  });

  it("reports each remaining note by line instead of a bare count", () => {
    const body = fixture("rosemount-3095mfa.md").replace("HART protocol.", "HART protocol (TBD).");
    const result = evaluateArticle({ id: "a1", slug: "x", title: "T", body_md: body }, catalog);
    const placeholder = result.checks.find((c) => c.id === "placeholders");
    expect(placeholder.state).toBe("fail");
    expect(placeholder.items).toEqual([expect.objectContaining({ where: "Body", text: "(TBD)", reason: "Draft note in parentheses" })]);
    expect(placeholder.items[0].line).toBeGreaterThan(1);
  });
});

describe("findUnresolvedNotes — what counts as a note", () => {
  const notesFor = (body_md) => findUnresolvedNotes({ body_md }).map((n) => n.text);

  it("catches common editorial placeholders", () => {
    const body = [
      "Max pressure is (insert pressure rating).",
      "TODO: add the wiring diagram",
      "Accuracy: TBD",
      "See [verify with the datasheet] for ranges.",
      "Insert here: installation photo",
      "Lead time (to be confirmed).",
      "Lorem ipsum dolor.",
      "Rated to ??? bar.",
      "FIXME",
    ].join("\n");
    expect(notesFor(body)).toEqual([
      "(insert pressure rating)", "TODO: add the wiring diagram", "TBD", "[verify with the datasheet]",
      "Insert here: installation photo", "(to be confirmed)", "Lorem ipsum", "???", "FIXME",
    ]);
  });

  it("leaves legitimate parentheses, brackets, links and prose alone", () => {
    const body = [
      "A 3/4 in (19 mm) hole, HART (4–20 mA) output.",
      "Width 5.67 [144,0] mm per the drawing.",
      "Insert the sensor through the Flange-Lok fitting.",
      "Always verify the model number against the nameplate.",
      "![Annubar sensor](/i.png) and [Add to quote list](/products)",
      "Use `[x]` in code.",
    ].join("\n");
    expect(notesFor(body)).toEqual([]);
  });

  it("checks the title, meta fields and excerpt too", () => {
    const notes = findUnresolvedNotes({ title: "Guide", meta_description: "Rosemount flowmeters TBD", excerpt: "[Write an excerpt]", body_md: "" });
    expect(notes.map((n) => [n.where, n.text])).toEqual([["Meta description", "TBD"], ["Excerpt", "[Write an excerpt]"]]);
  });
});

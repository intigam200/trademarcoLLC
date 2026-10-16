import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ADMIN_COLORS } from "../../theme";
import { buildBrief, briefToDraft, INTENTS, AUDIENCES, CONTENT_TYPES } from "../../../lib/seoAudit/briefBuilder";
import { evaluateArticle } from "../../../lib/seoAudit/contentChecklist";
import { createArticle } from "../../../lib/supabase/articles";
import { slugify } from "../../../data/catalog/schema";
import StatusBadge from "../../components/StatusBadge";
import { supabase } from "../../../lib/supabase/client";
import { SectionTitle, MigrationNotice, Empty, Notice, Field, table, inputStyle, btn, card } from "./ui";

const EMPTY = { query: "", intent: "informational", audience: AUDIENCES[0], contentType: CONTENT_TYPES[0], manufacturerId: "", categoryId: "", productIds: [], region: "", relatedArticleIds: [], sources: "", outcome: "" };

function BriefView({ brief }) {
  const block = (title, children) => (
    <div style={{ padding: "12px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}` }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: ADMIN_COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
  const list = (items) => <ul style={{ margin: 0, paddingLeft: 18 }}>{items.map((i, n) => <li key={n}>{i}</li>)}</ul>;
  return (
    <div style={{ ...card }}>
      <Notice>{brief.method}</Notice>
      {brief.overlapWarning && <div style={{ marginTop: 10 }}><Notice tone="warn" title="Overlap">{brief.overlapWarning}</Notice></div>}
      {block("Proposed title and H1", brief.proposedTitle)}
      {block("Primary query and variations", <><strong>{brief.query}</strong>{brief.variations.length > 0 && list(brief.variations)}<div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray, marginTop: 4 }}>Variations are phrasing patterns, not measured search volumes. Confirm demand in Search Console once connected.</div></>)}
      {block("Search intent and audience", <>{brief.intentLabel}<br />{brief.audience}: {brief.audienceNeeds}</>)}
      {block("Outline", list(brief.outline.map((h) => `H${h.level}: ${h.text}`)))}
      {block("Questions to answer", list(brief.questions))}
      {block("Facts that must be verified", list(brief.factsToVerify))}
      {block("Source requirements", list(brief.sourceRequirements))}
      {block("Internal links (real catalogue URLs)", brief.internalLinks.length ? list(brief.internalLinks.map((l) => <><code>{l.href}</code> — {l.label} <span style={{ color: ADMIN_COLORS.medGray }}>({l.reason})</span></>)) : "Select a manufacturer, category or products to get link suggestions.")}
      {brief.relatedArticles.length > 0 && block("Related articles", list(brief.relatedArticles.map((a) => `${a.label} — ${a.href}`)))}
      {block("Call to action", brief.cta)}
      {block("Suggested meta title", <>{brief.metaTitle} <span style={{ color: ADMIN_COLORS.medGray }}>({brief.metaTitle.length})</span></>)}
      {block("Suggested meta description", <>{brief.metaDescription} <span style={{ color: ADMIN_COLORS.medGray }}>({brief.metaDescription.length})</span></>)}
    </div>
  );
}

export default function ContentTab({ data }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [brief, setBrief] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const catalog = useMemo(() => ({ products: data.products, manufacturers: data.manufacturers, categories: data.categories, articles: data.articles }), [data]);
  const scored = useMemo(() => data.articles.map((a) => ({ article: a, result: evaluateArticle(a, catalog) })), [data.articles, catalog]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const productMatches = productSearch.trim().length >= 2
    ? data.products.filter((p) => p.status === "published" && !form.productIds.includes(p.id) && `${p.part_number} ${p.product_name}`.toLowerCase().includes(productSearch.trim().toLowerCase())).slice(0, 8)
    : [];

  const generate = (e) => {
    e.preventDefault();
    setBrief(buildBrief({ ...form, sources: form.sources.split("\n").map((s) => s.trim()).filter(Boolean) }, catalog));
  };

  const createDraft = async () => {
    setCreating(true);
    setError("");
    try {
      let slug = slugify(brief.proposedTitle).slice(0, 80).replace(/-+$/, "");
      const taken = new Set(data.articles.map((a) => a.slug));
      for (let n = 2; taken.has(slug); n++) slug = `${slugify(brief.proposedTitle).slice(0, 76)}-${n}`;
      const { data: session } = await supabase.auth.getSession();
      const sources = form.sources.split("\n").map((s) => s.trim()).filter(Boolean).map((url) => ({ url, title: "", note: "From the brief" }));
      const article = await createArticle({
        slug,
        title: brief.proposedTitle,
        meta_title: brief.metaTitle,
        meta_description: brief.metaDescription,
        body_md: briefToDraft(brief),
        primary_query: brief.query,
        search_intent: form.intent,
        audience: form.audience,
        content_type: form.contentType,
        manufacturer_id: form.manufacturerId || null,
        category_id: form.categoryId || null,
        related_product_ids: form.productIds,
        brief,
        sources,
        status: "draft",
        author_id: session.session?.user?.id || null,
      });
      navigate(`/admin/seo/content/${article.id}`);
    } catch (err) {
      setError(err.message);
      setCreating(false);
    }
  };

  return (
    <div>
      {!data.migration.articles && <div style={{ marginBottom: 16 }}><MigrationNotice what="Saving articles" /></div>}

      <SectionTitle action={data.migration.articles && <Link to="/admin/seo/content/new" style={{ ...btn.secondary, textDecoration: "none" }}>Blank article</Link>}>Articles</SectionTitle>
      {scored.length === 0 ? (
        <Empty>No articles yet. Start from a brief below — it suggests a structure and real catalogue links.</Empty>
      ) : (
        <div style={table.wrap}>
          <table style={table.table}>
            <thead><tr>{["Title", "Primary query", "Status", "Checklist", "Updated", ""].map((h) => <th key={h} scope="col" style={table.th}>{h}</th>)}</tr></thead>
            <tbody>
              {scored.map(({ article: a, result }) => (
                <tr key={a.id}>
                  <td style={{ ...table.td, minWidth: 220 }}><strong>{a.title}</strong><div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray }}>/articles/{a.slug}</div></td>
                  <td style={table.td}>{a.primary_query || <span style={{ color: ADMIN_COLORS.warning }}>Not set</span>}</td>
                  <td style={table.td}><StatusBadge status={a.status} /></td>
                  <td style={table.td}>{result.score}% · {result.checks.filter((c) => c.state === "fail").length} fail · {result.checks.filter((c) => c.kind === "human" && c.state !== "pass").length} awaiting review</td>
                  <td style={{ ...table.td, fontSize: 12, color: ADMIN_COLORS.medGray }}>{new Date(a.updated_at).toLocaleDateString()}</td>
                  <td style={table.td}><Link to={`/admin/seo/content/${a.id}`} style={{ ...btn.secondary, textDecoration: "none" }}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SectionTitle>Content brief</SectionTitle>
      <form onSubmit={generate} style={{ ...card, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <Field label="Primary search query" hint="The question a buyer types, e.g. “fisher 8580 replacement seal kit”.">
          <input required style={inputStyle} value={form.query} onChange={set("query")} />
        </Field>
        <Field label="Search intent">
          <select style={inputStyle} value={form.intent} onChange={set("intent")}>{Object.entries(INTENTS).map(([k, v]) => <option key={k} value={k}>{v.split(" — ")[0]}</option>)}</select>
        </Field>
        <Field label="Audience">
          <select style={inputStyle} value={form.audience} onChange={set("audience")}>{AUDIENCES.map((a) => <option key={a}>{a}</option>)}</select>
        </Field>
        <Field label="Content type">
          <select style={inputStyle} value={form.contentType} onChange={set("contentType")}>{CONTENT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        <Field label="Manufacturer">
          <select style={inputStyle} value={form.manufacturerId} onChange={set("manufacturerId")}><option value="">—</option>{data.manufacturers.filter((m) => m.status === "active").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        </Field>
        <Field label="Category">
          <select style={inputStyle} value={form.categoryId} onChange={set("categoryId")}><option value="">—</option>{data.categories.filter((c) => c.status === "active").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </Field>
        <Field label="Relevant products" hint="Search published products by part number or name.">
          <input style={inputStyle} value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Type 2+ characters…" />
          {productMatches.length > 0 && (
            <div style={{ border: `1px solid ${ADMIN_COLORS.borderGray}`, borderRadius: 6, marginTop: 4, maxHeight: 180, overflowY: "auto" }}>
              {productMatches.map((p) => (
                <button key={p.id} type="button" onClick={() => { setForm((f) => ({ ...f, productIds: [...f.productIds, p.id] })); setProductSearch(""); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 12.5 }}>
                  {p.manufacturer?.name} {p.part_number} — {p.product_name}
                </button>
              ))}
            </div>
          )}
          {form.productIds.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {form.productIds.map((id) => {
                const p = data.products.find((x) => x.id === id);
                return <button key={id} type="button" onClick={() => setForm((f) => ({ ...f, productIds: f.productIds.filter((x) => x !== id) }))} style={{ ...btn.secondary, padding: "3px 8px", fontSize: 12 }} aria-label={`Remove ${p?.part_number}`}>{p?.part_number} ×</button>;
              })}
            </div>
          )}
        </Field>
        <Field label="Geographic target (optional)">
          <input style={inputStyle} value={form.region} onChange={set("region")} placeholder="e.g. Middle East" />
        </Field>
        <Field label="Related existing articles">
          <select multiple style={{ ...inputStyle, height: 74 }} value={form.relatedArticleIds} onChange={(e) => setForm((f) => ({ ...f, relatedArticleIds: [...e.target.selectedOptions].map((o) => o.value) }))} disabled={!data.articles.length}>
            {data.articles.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select>
        </Field>
        <Field label="Source materials and reference URLs" hint="One per line — datasheets, manuals, standards.">
          <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.sources} onChange={set("sources")} />
        </Field>
        <Field label="Intended business outcome">
          <input style={inputStyle} value={form.outcome} onChange={set("outcome")} placeholder="e.g. RFQs for Fisher 8580 spares" />
        </Field>
        <div style={{ display: "flex", alignItems: "end", gap: 8 }}>
          <button type="submit" style={btn.primary}>Generate brief</button>
          {brief && <button type="button" style={btn.secondary} onClick={() => { setBrief(null); setForm(EMPTY); }}>Clear</button>}
        </div>
      </form>

      {brief && (
        <>
          <SectionTitle action={
            <button type="button" style={btn.primary} onClick={createDraft} disabled={creating || !data.migration.articles} title={!data.migration.articles ? "Apply the database migration first" : undefined}>
              {creating ? "Creating…" : "Create draft from brief"}
            </button>
          }>Brief</SectionTitle>
          {error && <div style={{ marginBottom: 10 }}><Notice tone="error">{error}</Notice></div>}
          <BriefView brief={brief} />
        </>
      )}
    </div>
  );
}

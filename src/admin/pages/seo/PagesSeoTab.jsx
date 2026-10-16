import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ADMIN_COLORS } from "../../theme";
import { auditPages, landingPageCandidates, PAGE_CHECKS, SEVERITY_ORDER } from "../../../lib/seoAudit/catalogAudit";
import { manufacturerMeta, categoryMeta, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX } from "../../../lib/seoMeta";
import { updateManufacturer } from "../../../lib/supabase/manufacturers";
import { updateCategory } from "../../../lib/supabase/categories";
import { productUrl } from "../../../lib/seoAudit/linking";
import Modal from "../../components/Modal";
import { SeverityBadge, SectionTitle, Notice, Empty, Field, LengthCounter, SerpPreview, table, inputStyle, btn, card } from "./ui";

const SITE = "https://www.trademarco.com";

function pagePath(p) {
  return p.kind === "manufacturer" ? `/manufacturers/${p.record.slug}` : `/products?category=${p.record.slug}`;
}

function PageEditor({ page, onClose, onSaved }) {
  const r = page.record;
  const introKey = page.kind === "manufacturer" ? "description" : "full_description";
  const initial = { seo_title: r.seo_title ?? "", seo_description: r.seo_description ?? "", [introKey]: r[introKey] ?? "" };
  const [form, setForm] = useState(initial);
  const [review, setReview] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const meta = (page.kind === "manufacturer" ? manufacturerMeta : categoryMeta)({ ...r, ...form });
  const changes = Object.keys(initial).filter((k) => form[k] !== initial[k]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!window.confirm(`Apply ${changes.length} change${changes.length === 1 ? "" : "s"} to the live ${page.kind} page?`)) return;
    setSaving(true);
    try {
      const fields = Object.fromEntries(changes.map((k) => [k, form[k].trim() || null]));
      if (page.kind === "manufacturer") await updateManufacturer(r.id, fields);
      else await updateCategory(r.id, fields);
      onSaved();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`${page.kind === "manufacturer" ? "Brand" : "Category"} SEO — ${r.name}`}
      onClose={onClose}
      footer={review ? (
        <>
          <button type="button" style={btn.secondary} onClick={() => setReview(false)}>Back</button>
          <button type="button" style={btn.primary} onClick={save} disabled={saving}>{saving ? "Applying…" : "Apply to live site"}</button>
        </>
      ) : (
        <>
          <button type="button" style={btn.secondary} onClick={onClose}>Cancel</button>
          <button type="button" style={btn.primary} onClick={() => setReview(true)} disabled={!changes.length}>Review changes</button>
        </>
      )}
    >
      {error && <div style={{ marginBottom: 12 }}><Notice tone="error">{error}</Notice></div>}
      {review ? (
        changes.map((k) => (
          <div key={k} style={{ padding: "8px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}`, fontSize: 13 }}>
            <div style={{ fontWeight: 700 }}>{k}</div>
            <div style={{ color: ADMIN_COLORS.danger, textDecoration: "line-through", whiteSpace: "pre-wrap" }}>{initial[k] || "(empty)"}</div>
            <div style={{ color: ADMIN_COLORS.success, whiteSpace: "pre-wrap" }}>{form[k] || "(empty — template will be used)"}</div>
          </div>
        ))
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <Field label="SEO title" counter={<LengthCounter value={meta.title} max={TITLE_MAX} />} hint="Empty = template.">
            <input style={inputStyle} value={form.seo_title} onChange={set("seo_title")} />
          </Field>
          <Field label="Meta description" counter={<LengthCounter value={meta.description} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />} hint="Empty = the introduction text below.">
            <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.seo_description} onChange={set("seo_description")} />
          </Field>
          <Field label="Introduction (shown on the page)" hint="What this page covers and what you actually supply from it. Facts only — no claims you can't substantiate.">
            <textarea rows={5} style={{ ...inputStyle, resize: "vertical" }} value={form[introKey]} onChange={set(introKey)} />
          </Field>
          <SerpPreview title={meta.title} description={meta.description} url={`${SITE}${pagePath(page)}`} />
        </div>
      )}
    </Modal>
  );
}

export default function PagesSeoTab({ data, reload }) {
  const [params, setParams] = useSearchParams();
  const issue = params.get("issue") || "";
  const [editing, setEditing] = useState(null);

  const pages = useMemo(() => {
    const counts = new Map();
    for (const p of data.products) {
      if (p.status !== "published") continue;
      counts.set(`m:${p.manufacturer_id}`, (counts.get(`m:${p.manufacturer_id}`) || 0) + 1);
      counts.set(`c:${p.category_id}`, (counts.get(`c:${p.category_id}`) || 0) + 1);
    }
    return auditPages([
      ...data.manufacturers.map((m) => ({ kind: "manufacturer", record: m, productCount: counts.get(`m:${m.id}`) || 0 })),
      ...data.categories.map((c) => ({ kind: "category", record: c, productCount: counts.get(`c:${c.id}`) || 0 })),
    ]).sort((a, b) => (SEVERITY_ORDER[a.worst] ?? 9) - (SEVERITY_ORDER[b.worst] ?? 9));
  }, [data]);

  const visible = issue ? pages.filter((p) => p.issues.includes(issue)) : pages;
  const candidates = useMemo(() => landingPageCandidates(data.products), [data.products]);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <select aria-label="Filter by issue" style={{ ...inputStyle, width: "auto" }} value={issue} onChange={(e) => { const n = new URLSearchParams(params); if (e.target.value) n.set("issue", e.target.value); else n.delete("issue"); setParams(n, { replace: true }); }}>
          <option value="">All brand and category pages ({pages.length})</option>
          {Object.entries(PAGE_CHECKS).map(([id, d]) => <option key={id} value={id}>{d.label} ({pages.filter((p) => p.issues.includes(id)).length})</option>)}
        </select>
      </div>

      {visible.length === 0 ? <Empty>No pages match.</Empty> : (
        <div style={table.wrap}>
          <table style={table.table}>
            <thead>
              <tr>{["Page", "Products", "SEO title", "Meta description", "Intro", "Canonical", "Indexability", "Issues", ""].map((h) => <th key={h} scope="col" style={table.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const intro = p.kind === "manufacturer" ? p.record.description : (p.record.full_description || p.record.description);
                return (
                  <tr key={`${p.kind}-${p.record.id}`}>
                    <td style={{ ...table.td, minWidth: 170 }}>
                      <strong>{p.record.name}</strong>
                      <div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray }}>{p.kind === "manufacturer" ? "Brand" : "Category"} · {pagePath(p)}</div>
                    </td>
                    <td style={{ ...table.td, color: p.productCount ? undefined : ADMIN_COLORS.danger }}>{p.productCount}</td>
                    <td style={{ ...table.td, minWidth: 200 }}>{p.meta.title}<div style={{ fontSize: 11, color: ADMIN_COLORS.medGray }}>{p.meta.titleSource} · {p.meta.title.length} chars</div></td>
                    <td style={{ ...table.td, minWidth: 220 }}>{p.meta.description.length > 100 ? `${p.meta.description.slice(0, 100)}…` : p.meta.description}<div style={{ fontSize: 11, color: ADMIN_COLORS.medGray }}>{p.meta.descriptionSource} · {p.meta.description.length} chars</div></td>
                    <td style={table.td}>{intro ? `${intro.length} chars` : <span style={{ color: ADMIN_COLORS.warning }}>None</span>}</td>
                    <td style={{ ...table.td, fontSize: 12 }}>Self (template)</td>
                    <td style={table.td}>{p.record.status === "active" ? "In sitemap" : <span style={{ color: ADMIN_COLORS.medGray }}>Not public</span>}</td>
                    <td style={{ ...table.td, minWidth: 160 }}>
                      <SeverityBadge severity={p.worst} />
                      {p.issues.map((id) => <div key={id} style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray, marginTop: 3 }}>{PAGE_CHECKS[id].label}</div>)}
                    </td>
                    <td style={table.td}><button type="button" style={btn.secondary} onClick={() => setEditing(p)}>Edit</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {issue && PAGE_CHECKS[issue] && (
        <div style={{ marginTop: 12 }}>
          <Notice title={PAGE_CHECKS[issue].label}><div><strong>Impact:</strong> {PAGE_CHECKS[issue].impact}</div><div><strong>Recommended fix:</strong> {PAGE_CHECKS[issue].fix}</div></Notice>
        </div>
      )}

      <SectionTitle>Landing page candidates</SectionTitle>
      <p style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray, margin: "-4px 0 12px", lineHeight: 1.55 }}>
        Brand × category combinations with at least 12 published products — enough real inventory that a dedicated page could answer a distinct search such as “Flowserve control valves”. These are recommendations for review only. The site has no template for such pages yet, and each one overlaps with its brand page, so only build one if its intent is clearly narrower.
      </p>
      {candidates.length === 0 ? <Empty>No combination has enough products yet.</Empty> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {candidates.slice(0, 9).map((c) => {
            const title = `${c.manufacturer.name} ${c.category.name} | Trademarco Global`;
            return (
              <div key={`${c.manufacturer.slug}-${c.category.slug}`} style={{ ...card, padding: 16, fontSize: 12.5, lineHeight: 1.55 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.navy }}>{c.manufacturer.name} · {c.category.name}</div>
                <div style={{ color: ADMIN_COLORS.medGray, marginBottom: 8 }}>{c.count} published products</div>
                <div><strong>Suggested title:</strong> {title} <span style={{ color: title.length > TITLE_MAX ? ADMIN_COLORS.warning : ADMIN_COLORS.medGray }}>({title.length})</span></div>
                <div><strong>Suggested description:</strong> {c.manufacturer.name} {c.category.name.toLowerCase()} sourced by Trademarco Global — {c.count} models listed with part numbers. Request a quotation.</div>
                <div style={{ marginTop: 6 }}><strong>Outline:</strong> introduction to this {c.manufacturer.name} range · product list grouped by series · selection notes from datasheets · quote request.</div>
                <div style={{ marginTop: 6 }}><strong>Would link to:</strong> /manufacturers/{c.manufacturer.slug}, /products?category={c.category.slug}, and e.g. {c.products.slice(0, 2).map((p) => productUrl(p)).join(", ")}</div>
                <div style={{ marginTop: 6, color: c.count / c.brandTotal > 0.8 ? ADMIN_COLORS.danger : ADMIN_COLORS.warning }}>
                  <strong>Overlap:</strong> {Math.round((c.count / c.brandTotal) * 100)}% of {c.manufacturer.name}&rsquo;s published products — {c.count / c.brandTotal > 0.8 ? "almost the same set as the brand page; a separate page would mostly duplicate it." : "the brand page also lists these; the new page must target the narrower intent."}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && <PageEditor page={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}

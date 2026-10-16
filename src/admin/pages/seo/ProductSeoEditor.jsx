import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ADMIN_COLORS } from "../../theme";
import { supabase } from "../../../lib/supabase/client";
import { updateProduct } from "../../../lib/supabase/products";
import { productMeta, truncateAtWord, ORG_NAME, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX } from "../../../lib/seoMeta";
import { PRODUCT_CHECKS } from "../../../lib/seoAudit/catalogAudit";
import { suggestRelatedProducts, productUrl } from "../../../lib/seoAudit/linking";
import { slugify } from "../../../data/catalog/schema";
import Icon from "../../../components/Icon";
import { Field, LengthCounter, SerpPreview, SeverityBadge, Notice, btn, inputStyle, card } from "./ui";

const SITE = "https://www.trademarco.com";
const draftKey = (id) => `tm-seo-draft:product:${id}`;

const EDITABLE = ["seo_title", "seo_description", "product_name", "slug", "short_description", "long_description", "image_alt"];
// NOT NULL in the products table — can be changed but never emptied.
const REQUIRED = ["product_name", "slug", "short_description"];
const LABELS = { seo_title: "SEO title", seo_description: "Meta description", product_name: "H1 (product name)", slug: "URL slug", short_description: "Short description", long_description: "Long description", image_alt: "Image alt text" };

// Suggestions are built only from this product's own verified fields. If there
// is no product text to build a description from, none is offered.
function suggestTitle(p) {
  const brand = p.manufacturer?.name ?? "";
  const base = `${brand} ${p.part_number} – ${p.product_name}`.replace(/\s+/g, " ").trim();
  const full = `${base} | ${ORG_NAME}`;
  if (full.length <= TITLE_MAX) return full;
  if (base.length <= TITLE_MAX) return base;
  return truncateAtWord(base, TITLE_MAX);
}

function suggestDescription(p) {
  const source = (p.short_description || "").trim() || (p.long_description || "").split(/(?<=[.!?])\s/)[0]?.trim() || "";
  if (!source) return null;
  const withCta = `${source.replace(/[.\s]+$/, "")}. Request a quote from ${ORG_NAME}.`;
  if (withCta.length <= DESCRIPTION_MAX) return withCta;
  return truncateAtWord(source, DESCRIPTION_MAX);
}

export default function ProductSeoEditor({ row, data, onClose, onSaved }) {
  const product = row.product;
  const initial = useMemo(() => Object.fromEntries(EDITABLE.map((k) => [k, product[k] ?? ""])), [product]);
  const [form, setForm] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey(product.id)) || "null");
      if (saved && saved.basedOn === product.updated_at) return { ...initial, ...saved.fields };
    } catch { /* no draft */ }
    return initial;
  });
  const [step, setStep] = useState("edit"); // edit | review
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [slugIssue, setSlugIssue] = useState("");
  const [related, setRelated] = useState(() => data.related.filter((r) => r.product_id === product.id).map((r) => r.related_product_id));
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isPublished = product.status === "published";
  const preview = productMeta({ ...product, ...form, manufacturer: product.manufacturer });
  const changes = EDITABLE.filter((k) => (form[k] ?? "") !== (initial[k] ?? "") && (k !== "image_alt" || data.migration.imageAlt));
  const emptiedRequired = changes.filter((k) => REQUIRED.includes(k) && !(form[k] ?? "").trim());
  const titleSuggestion = suggestTitle(product);
  const descriptionSuggestion = suggestDescription({ ...product, ...form });
  const linkSuggestions = useMemo(() => suggestRelatedProducts(product, data.products, { existingIds: related }), [product, data.products, related]);

  // Slug safeguards: lowercase-hyphen form, unique within the brand, and never
  // changed on a published product — there is no redirect system, so the old
  // URL (and anything Google indexed under it) would simply 404.
  useEffect(() => {
    if (form.slug === initial.slug) { setSlugIssue(""); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) { setSlugIssue("Use lowercase letters, numbers and single hyphens."); return; }
    const clash = data.products.find((p) => p.id !== product.id && p.manufacturer_id === product.manufacturer_id && p.slug === form.slug);
    setSlugIssue(clash ? `Already used by ${clash.part_number} (${clash.status}).` : "");
  }, [form.slug, initial.slug, data.products, product]);

  const saveDraft = () => {
    try {
      localStorage.setItem(draftKey(product.id), JSON.stringify({ basedOn: product.updated_at, fields: Object.fromEntries(changes.map((k) => [k, form[k]])) }));
      setMessage({ tone: "info", text: "Draft saved in this browser. Nothing on the live site has changed." });
    } catch {
      setMessage({ tone: "error", text: "This browser blocked local storage, so the draft could not be saved." });
    }
  };

  const apply = async () => {
    if (!window.confirm(`Apply ${changes.length} change${changes.length === 1 ? "" : "s"} to the live product page?`)) return;
    setSaving(true);
    setMessage(null);
    try {
      // Empty optional fields become null so the template fallback applies.
      const fields = Object.fromEntries(changes.map((k) => [k, (form[k] ?? "").trim() || null]));
      await updateProduct(product.id, fields);
      localStorage.removeItem(draftKey(product.id));
      onSaved();
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
      setSaving(false);
    }
  };

  const addRelated = async (other) => {
    if (!window.confirm(`Link ${product.part_number} → ${other.part_number} as a related product? It appears on the live product page.`)) return;
    const { error } = await supabase.from("product_related").insert({ product_id: product.id, related_product_id: other.id });
    if (error) setMessage({ tone: "error", text: error.message });
    else { setRelated((r) => [...r, other.id]); setMessage({ tone: "info", text: `Added ${other.part_number} as a related product.` }); }
  };

  const specs = [
    ["Series", product.series], ["Type", product.type], ["Size", product.size], ["Rating", product.rating],
    ["Alternative part numbers", (product.alternative_part_numbers || []).join(", ")],
    ["Applications", (product.applications || []).join(", ")], ["Industries", (product.industries || []).join(", ")],
  ].filter(([, v]) => v);

  return (
    <div role="presentation" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
      <div
        role="dialog" aria-modal="true" aria-labelledby="seo-editor-title" tabIndex={-1} ref={panelRef}
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(980px, 100vw)", height: "100%", overflowY: "auto", background: ADMIN_COLORS.contentBg, boxShadow: "-10px 0 40px rgba(0,0,0,0.2)", outline: "none" }}
      >
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: ADMIN_COLORS.white, borderBottom: `1px solid ${ADMIN_COLORS.borderGray}`, padding: "14px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 id="seo-editor-title" style={{ fontSize: 16, margin: 0, color: ADMIN_COLORS.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{product.product_name}</h2>
            <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>
              {product.manufacturer?.name} · {product.part_number} · {product.status}
              {isPublished && <> · <a href={`${SITE}${productUrl(product)}`} target="_blank" rel="noreferrer" style={{ color: ADMIN_COLORS.accent }}>view live page</a></>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close editor" style={{ ...btn.secondary, padding: 8 }}><Icon type="close" size={16} /></button>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 16 }}>
          {message && <Notice tone={message.tone === "error" ? "error" : "info"}>{message.text}</Notice>}

          {row.issues.length > 0 && (
            <div style={{ ...card, padding: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 8 }}>Detected on this product</div>
              <div style={{ display: "grid", gap: 6 }}>
                {row.issues.map((id) => (
                  <div key={id} style={{ fontSize: 12.5, display: "flex", gap: 8, alignItems: "baseline" }}>
                    <SeverityBadge severity={PRODUCT_CHECKS[id].severity} />
                    <span><strong>{PRODUCT_CHECKS[id].label}.</strong> {PRODUCT_CHECKS[id].fix}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "edit" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, alignItems: "start" }}>
              <div style={{ display: "grid", gap: 14 }}>
                <Field label="SEO title" counter={<LengthCounter value={preview.title} max={TITLE_MAX} />} hint={`Leave empty to use the template: “${productMeta({ ...product, seo_title: "" }).title}”.`}>
                  <input style={inputStyle} value={form.seo_title} onChange={set("seo_title")} />
                </Field>
                <button type="button" style={{ ...btn.link, fontSize: 12 }} onClick={() => setForm((f) => ({ ...f, seo_title: titleSuggestion }))}>Use suggestion: “{titleSuggestion}”</button>

                <Field label="Meta description" counter={<LengthCounter value={preview.description} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />} hint="Leave empty to use the short description.">
                  <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.seo_description} onChange={set("seo_description")} />
                </Field>
                {descriptionSuggestion
                  ? <button type="button" style={{ ...btn.link, fontSize: 12, whiteSpace: "normal", textAlign: "left" }} onClick={() => setForm((f) => ({ ...f, seo_description: descriptionSuggestion }))}>Use suggestion (from the product text): “{descriptionSuggestion}”</button>
                  : <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>No suggestion — this product has no description text to build one from.</div>}

                <Field label="H1 (product name)">
                  <input style={inputStyle} value={form.product_name} onChange={set("product_name")} />
                </Field>

                <Field label="URL slug" hint={isPublished ? "Locked: this page is live and the site has no redirects, so changing the URL would break it for anyone (and any search engine) using the old one." : slugIssue || `/manufacturers/${product.manufacturer?.slug}/${form.slug}`}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input style={{ ...inputStyle, borderColor: slugIssue ? ADMIN_COLORS.danger : ADMIN_COLORS.borderGray }} value={form.slug} onChange={set("slug")} disabled={isPublished} />
                    {!isPublished && <button type="button" style={btn.secondary} onClick={() => setForm((f) => ({ ...f, slug: slugify(`${product.part_number}`) }))}>From part no.</button>}
                  </div>
                </Field>

                <Field label="Short description" hint="Shown on the page and in product lists; used as the meta description when no custom one is set.">
                  <textarea rows={3} style={{ ...inputStyle, resize: "vertical" }} value={form.short_description} onChange={set("short_description")} />
                </Field>
                <Field label="Long description" hint="From the manufacturer's documentation only — no unverified specifications, certifications, stock or lead-time claims.">
                  <textarea rows={6} style={{ ...inputStyle, resize: "vertical" }} value={form.long_description} onChange={set("long_description")} />
                </Field>
                <Field label="Image alt text" hint={!data.migration.imageAlt ? "Available after the database migration." : !product.image_url ? "This product has no image yet." : "Describe what the photo shows. Empty = product name."}>
                  <input style={inputStyle} value={form.image_alt} onChange={set("image_alt")} disabled={!data.migration.imageAlt || !product.image_url} placeholder={productMeta(product).imageAlt} />
                </Field>
              </div>

              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 6 }}>Search result preview</div>
                  <SerpPreview title={preview.title} description={preview.description} url={`${SITE}${productUrl({ ...product, slug: form.slug })}`} />
                </div>

                <div style={{ ...card, padding: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 8 }}>Verified specifications (from the database)</div>
                  {specs.length ? (
                    <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 12.5 }}>
                      {specs.map(([k, v]) => <Fragment key={k}><dt style={{ color: ADMIN_COLORS.medGray }}>{k}</dt><dd style={{ margin: 0 }}>{v}</dd></Fragment>)}
                    </dl>
                  ) : <div style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray }}>No structured specifications recorded. Add them in the product editor from the datasheet.</div>}
                  {product.datasheet_url && <a href={product.datasheet_url} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 12.5, color: ADMIN_COLORS.accent }}>Open datasheet</a>}
                </div>

                <div style={{ ...card, padding: 14 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 4 }}>Suggested internal links</div>
                  <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginBottom: 10 }}>
                    Related products appear on the live page and in the version crawlers receive. {related.length} linked now.
                  </div>
                  {linkSuggestions.length === 0 ? (
                    <div style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray }}>No strong matches (same series or part-number family) among published products.</div>
                  ) : linkSuggestions.map((s) => (
                    <div key={s.product.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", padding: "6px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}` }}>
                      <div style={{ fontSize: 12.5, minWidth: 0 }}>
                        <div style={{ fontWeight: 600 }}>{s.product.part_number} — {s.product.product_name}</div>
                        <div style={{ color: ADMIN_COLORS.medGray, fontSize: 11.5 }}>Anchor: “{product.manufacturer?.name} {s.product.part_number}” · {s.reason}</div>
                      </div>
                      <button type="button" style={btn.secondary} onClick={() => addRelated(s.product)}>Add</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 12 }}>Review changes before they go live</div>
              {changes.map((k) => (
                <div key={k} style={{ padding: "10px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}`, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{LABELS[k]}</div>
                  <div style={{ color: ADMIN_COLORS.danger, textDecoration: "line-through", whiteSpace: "pre-wrap" }}>{initial[k] || "(empty)"}</div>
                  <div style={{ color: ADMIN_COLORS.success, whiteSpace: "pre-wrap" }}>{form[k] || "(empty — template will be used)"}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: "sticky", bottom: 0, background: ADMIN_COLORS.white, borderTop: `1px solid ${ADMIN_COLORS.borderGray}`, padding: "12px 20px", display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {step === "edit" ? (
            <>
              <button type="button" style={btn.secondary} onClick={() => setForm(initial)} disabled={!changes.length}>Discard changes</button>
              <button type="button" style={btn.secondary} onClick={saveDraft} disabled={!changes.length}>Save draft</button>
              <button type="button" style={btn.primary} onClick={() => setStep("review")} disabled={!changes.length || !!slugIssue || emptiedRequired.length > 0} title={emptiedRequired.length ? `Can't be empty: ${emptiedRequired.map((k) => LABELS[k]).join(", ")}` : undefined}>Review {changes.length || ""} change{changes.length === 1 ? "" : "s"}</button>
            </>
          ) : (
            <>
              <button type="button" style={btn.secondary} onClick={() => setStep("edit")}>Back to editing</button>
              <button type="button" style={btn.primary} onClick={apply} disabled={saving}>{saving ? "Applying…" : "Apply to live site"}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

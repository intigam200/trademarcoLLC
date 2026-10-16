import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ADMIN_COLORS } from "../../theme";
import PageHeader from "../../components/PageHeader";
import StatusBadge from "../../components/StatusBadge";
import Icon from "../../../components/Icon";
import { supabase } from "../../../lib/supabase/client";
import { createArticle, updateArticle, deleteArticle } from "../../../lib/supabase/articles";
import { uploadArticleImage } from "../../../lib/supabase/storage";
import { renderMarkdown } from "../../../lib/markdown";
import { ARTICLE_BODY_CSS } from "../../../lib/articlePresentation";
import { articleMeta, TITLE_MAX, DESCRIPTION_MIN, DESCRIPTION_MAX } from "../../../lib/seoMeta";
import { evaluateArticle, contentFingerprint, GROUPS } from "../../../lib/seoAudit/contentChecklist";
import { suggestArticleLinks, productUrl } from "../../../lib/seoAudit/linking";
import { INTENTS } from "../../../lib/seoAudit/briefBuilder";
import { slugify } from "../../../data/catalog/schema";
import { useSeoData } from "./useSeoData";
import { Field, LengthCounter, SerpPreview, StateBadge, Notice, MigrationNotice, Loading, btn, inputStyle, card } from "./ui";

const SITE = "https://www.trademarco.com";
const BLANK = { title: "", slug: "", meta_title: "", meta_description: "", excerpt: "", body_md: "", hero_image_url: "", hero_image_alt: "", primary_query: "", search_intent: "informational", sources: [], review: {}, status: "draft" };
const FIELDS = Object.keys(BLANK);

function LinkPicker({ data, onPick, onClose }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const options = useMemo(() => {
    if (term.length < 2) return [];
    const out = [];
    for (const m of data.manufacturers) if (m.status === "active" && m.name.toLowerCase().includes(term)) out.push({ href: `/manufacturers/${m.slug}`, label: `${m.name} products`, kind: "Brand" });
    for (const c of data.categories) if (c.status === "active" && c.name.toLowerCase().includes(term)) out.push({ href: `/products?category=${c.slug}`, label: c.name, kind: "Category" });
    for (const a of data.articles) if (a.status === "published" && a.title.toLowerCase().includes(term)) out.push({ href: `/articles/${a.slug}`, label: a.title, kind: "Article" });
    for (const p of data.products) if (p.status === "published" && `${p.part_number} ${p.product_name}`.toLowerCase().includes(term)) out.push({ href: productUrl(p), label: `${p.manufacturer?.name} ${p.part_number}`, kind: "Product" });
    return out.slice(0, 12);
  }, [term, data]);
  return (
    <div style={{ ...card, padding: 12, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <input autoFocus aria-label="Search pages to link" style={inputStyle} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products, brands, categories, articles…" />
        <button type="button" style={btn.secondary} onClick={onClose}>Close</button>
      </div>
      {options.map((o) => (
        <button key={o.href} type="button" onClick={() => onPick(o)} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 4px", border: "none", borderBottom: `1px solid ${ADMIN_COLORS.borderGray}`, background: "none", cursor: "pointer", fontSize: 12.5 }}>
          <span style={{ color: ADMIN_COLORS.medGray }}>{o.kind}</span> · {o.label} <code style={{ fontSize: 11 }}>{o.href}</code>
        </button>
      ))}
      {term.length >= 2 && !options.length && <div style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray, paddingTop: 8 }}>No published page matches.</div>}
    </div>
  );
}

export default function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loading, error, data, reload } = useSeoData();
  const [form, setForm] = useState(BLANK);
  const [saved, setSaved] = useState(BLANK);
  const [record, setRecord] = useState(null);
  const [view, setView] = useState("edit"); // edit | desktop | mobile
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);
  const [picker, setPicker] = useState(false);
  const [email, setEmail] = useState("");
  const textRef = useRef(null);

  useEffect(() => { supabase.auth.getSession().then(({ data: s }) => setEmail(s.session?.user?.email || "")); }, []);

  useEffect(() => {
    if (!data) return;
    if (!id) { setForm(BLANK); setSaved(BLANK); setRecord(null); return; }
    const found = data.articles.find((a) => a.id === id);
    if (found) {
      const values = Object.fromEntries(FIELDS.map((k) => [k, found[k] ?? BLANK[k]]));
      setForm(values); setSaved(values); setRecord(found);
    }
  }, [data, id]);

  const dirty = FIELDS.some((k) => JSON.stringify(form[k]) !== JSON.stringify(saved[k]));
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => { document.title = `${form.title || "New article"} | SEO Growth Center`; }, [form.title]);

  const catalog = useMemo(() => (data ? { products: data.products, manufacturers: data.manufacturers, categories: data.categories, articles: data.articles } : null), [data]);
  const evaluation = useMemo(() => (catalog ? evaluateArticle({ ...record, ...form, id: record?.id }, catalog) : null), [form, record, catalog]);
  const linkSuggestions = useMemo(() => (catalog ? suggestArticleLinks(`${form.title}\n${form.body_md}`, evaluation?.analysis.links.map((l) => l.href) ?? [], catalog).slice(0, 10) : []), [form.title, form.body_md, evaluation, catalog]);

  if (loading && !data) return <Loading label="Loading editor…" />;
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data.migration.articles) return <><PageHeader title="Article editor" /><MigrationNotice what="The article editor" /></>;
  if (id && !record) return <Notice tone="error" title="Article not found">It may have been deleted. <Link to="/admin/seo/content">Back to Content Studio</Link></Notice>;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const meta = articleMeta(form);

  const insert = (text) => {
    const el = textRef.current;
    const body = form.body_md;
    const start = el ? el.selectionStart : body.length;
    const end = el ? el.selectionEnd : body.length;
    const next = body.slice(0, start) + text + body.slice(end);
    setForm((f) => ({ ...f, body_md: next }));
    requestAnimationFrame(() => { if (el) { el.focus(); el.selectionStart = el.selectionEnd = start + text.length; } });
  };
  // Selects a body line in the editor, so a flagged note can be fixed in place.
  const jumpToLine = (lineNumber) => {
    setView("edit");
    requestAnimationFrame(() => {
      const el = textRef.current;
      if (!el) return;
      const lines = form.body_md.split("\n");
      const start = lines.slice(0, lineNumber - 1).reduce((n, l) => n + l.length + 1, 0);
      el.focus();
      el.setSelectionRange(start, start + (lines[lineNumber - 1] ?? "").length);
      // Scroll the selected line into view inside the textarea.
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20;
      el.scrollTop = Math.max(0, (lineNumber - 3) * lineHeight);
    });
  };

  const wrap = (before, after = before, placeholder = "text") => {
    const el = textRef.current;
    const sel = el ? form.body_md.slice(el.selectionStart, el.selectionEnd) : "";
    insert(`${before}${sel || placeholder}${after}`);
  };

  const uploadImage = async (file, { hero = false } = {}) => {
    if (!file) return;
    const alt = window.prompt("Describe the image (alt text). Required for accessibility and image search:", "");
    if (alt === null) return;
    if (!alt.trim()) { setMessage({ tone: "error", text: "Alt text is required — image not added." }); return; }
    setBusy("Uploading image…");
    try {
      const url = await uploadArticleImage(file);
      if (hero) setForm((f) => ({ ...f, hero_image_url: url, hero_image_alt: alt.trim() }));
      else insert(`\n![${alt.trim().replace(/[[\]]/g, "")}](${url})\n`);
    } catch (err) {
      setMessage({ tone: "error", text: `Upload failed: ${err.message}` });
    } finally {
      setBusy("");
    }
  };

  const payload = (overrides = {}) => {
    const v = { ...form, ...overrides };
    return {
      title: v.title.trim(), slug: v.slug.trim(),
      meta_title: v.meta_title.trim() || null, meta_description: v.meta_description.trim() || null, excerpt: v.excerpt.trim() || null,
      body_md: v.body_md, hero_image_url: v.hero_image_url || null, hero_image_alt: v.hero_image_alt.trim() || null,
      primary_query: v.primary_query.trim() || null, search_intent: v.search_intent || null,
      sources: v.sources.filter((s) => s.url.trim()), review: v.review, status: v.status,
      ...(v.status === "published" && !record?.published_at ? { published_at: new Date().toISOString() } : {}),
    };
  };

  const persist = async (overrides, successText) => {
    if (!form.title.trim()) { setMessage({ tone: "error", text: "Add a title first." }); return; }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(form.slug)) { setMessage({ tone: "error", text: "The URL slug must be lowercase words separated by hyphens." }); return; }
    if (data.articles.some((a) => a.slug === form.slug && a.id !== record?.id)) { setMessage({ tone: "error", text: "Another article already uses this URL." }); return; }
    setBusy("Saving…");
    setMessage(null);
    try {
      const row = record ? await updateArticle(record.id, payload(overrides)) : await createArticle(payload(overrides));
      const values = Object.fromEntries(FIELDS.map((k) => [k, row[k] ?? BLANK[k]]));
      setForm(values); setSaved(values); setRecord(row);
      setMessage({ tone: "info", text: successText });
      reload();
      if (!record) navigate(`/admin/seo/content/${row.id}`, { replace: true });
    } catch (err) {
      setMessage({ tone: "error", text: err.message });
    } finally {
      setBusy("");
    }
  };

  const isLive = record?.status === "published";
  const save = () => {
    if (isLive && !window.confirm("This article is live. Save these changes to the published page?")) return;
    persist({}, isLive ? "Live article updated." : "Draft saved.");
  };
  const publish = () => {
    if (!evaluation.canPublish) return;
    if (!window.confirm("Publish this article? It becomes public, indexable and listed in sitemap.xml.")) return;
    persist({ status: "published" }, "Published.");
  };
  const unpublish = () => {
    if (!window.confirm("Unpublish? The page will stop being public; its URL will return “not found”.")) return;
    persist({ status: "draft" }, "Unpublished — now a draft.");
  };
  const remove = async () => {
    if (!window.confirm("Delete this draft permanently? This cannot be undone.")) return;
    await deleteArticle(record.id);
    navigate("/admin/seo/content");
  };

  // A sign-off records the fingerprint of the text it was given for; editing
  // the text afterwards invalidates it (see evaluateArticle).
  const toggleSignOff = (checkId, isCurrent) => {
    setForm((f) => {
      const review = { ...f.review };
      if (isCurrent) delete review[checkId];
      else review[checkId] = { by: email || "admin", at: new Date().toISOString(), hash: contentFingerprint(f) };
      return { ...f, review };
    });
  };

  const tool = (label, onClick, icon) => (
    <button type="button" onClick={onClick} style={{ ...btn.secondary, padding: "5px 9px", fontSize: 12 }} aria-label={label} title={label}>
      {icon ? <Icon type={icon} size={13} /> : label}
    </button>
  );

  return (
    <div>
      <PageHeader
        title={record ? "Edit article" : "New article"}
        description={record ? <>Status: <StatusBadge status={record.status} />{isLive && <> · <a href={`${SITE}/articles/${record.slug}`} target="_blank" rel="noreferrer" style={{ color: ADMIN_COLORS.accent }}>view live</a></>}</> : "Saved as a draft; nothing is public until you publish."}
        actions={<Link to="/admin/seo/content" style={{ ...btn.secondary, textDecoration: "none" }}>Back to Content Studio</Link>}
      />
      {message && <div style={{ marginBottom: 12 }}><Notice tone={message.tone === "error" ? "error" : "info"}>{message.text}</Notice></div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(280px, 360px)", gap: 16, alignItems: "start" }} className="tm-article-editor">
        <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
          <div style={{ ...card, display: "grid", gap: 12 }}>
            <Field label="Title (H1)">
              <input style={inputStyle} value={form.title} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, title: v, slug: !record && (f.slug === "" || f.slug === slugify(f.title).slice(0, 80)) ? slugify(v).slice(0, 80) : f.slug })); }} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <Field label="URL slug" hint={isLive ? "Changing a published URL breaks links to it — there are no redirects." : `/articles/${form.slug}`}>
                <input style={inputStyle} value={form.slug} onChange={set("slug")} />
              </Field>
              <Field label="Primary search query">
                <input style={inputStyle} value={form.primary_query} onChange={set("primary_query")} />
              </Field>
              <Field label="Search intent">
                <select style={inputStyle} value={form.search_intent} onChange={set("search_intent")}>{Object.entries(INTENTS).map(([k, v]) => <option key={k} value={k}>{v.split(" — ")[0]}</option>)}</select>
              </Field>
            </div>
            <Field label="Meta title" counter={<LengthCounter value={meta.title} max={TITLE_MAX} />} hint="Empty = “Title | Trademarco Global”.">
              <input style={inputStyle} value={form.meta_title} onChange={set("meta_title")} />
            </Field>
            <Field label="Meta description" counter={<LengthCounter value={meta.description} min={DESCRIPTION_MIN} max={DESCRIPTION_MAX} />} hint="Empty = the excerpt.">
              <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.meta_description} onChange={set("meta_description")} />
            </Field>
            <Field label="Excerpt" hint="Shown on the articles list.">
              <textarea rows={2} style={{ ...inputStyle, resize: "vertical" }} value={form.excerpt} onChange={set("excerpt")} />
            </Field>
            <Field label="Hero image" hint={form.hero_image_url ? `Alt: “${form.hero_image_alt}”` : "Optional. You'll be asked for alt text."}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {form.hero_image_url && <img src={form.hero_image_url} alt={form.hero_image_alt} style={{ height: 48, borderRadius: 4 }} />}
                <label style={{ ...btn.secondary }}>
                  <Icon type="upload" size={13} /> {form.hero_image_url ? "Replace" : "Upload"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { uploadImage(e.target.files?.[0], { hero: true }); e.target.value = ""; }} />
                </label>
                {form.hero_image_url && <button type="button" style={btn.danger} onClick={() => setForm((f) => ({ ...f, hero_image_url: "", hero_image_alt: "" }))}>Remove</button>}
              </div>
            </Field>
          </div>

          <div style={{ ...card, padding: 14 }}>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
              {[["edit", "Write"], ["desktop", "Preview: desktop"], ["mobile", "Preview: mobile"]].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setView(v)} style={{ ...btn.secondary, padding: "5px 10px", fontSize: 12, ...(view === v ? { borderColor: ADMIN_COLORS.accent, color: ADMIN_COLORS.accent } : {}) }} aria-pressed={view === v}>{l}</button>
              ))}
              {view === "edit" && (
                <>
                  <span style={{ width: 1, height: 20, background: ADMIN_COLORS.borderGray, margin: "0 4px" }} />
                  {tool("H2", () => insert("\n## "))}
                  {tool("H3", () => insert("\n### "))}
                  {tool("Bold", () => wrap("**"))}
                  {tool("Italic", () => wrap("*"))}
                  {tool("List", () => insert("\n- "))}
                  {tool("Quote", () => insert("\n> "))}
                  {tool("External link", () => wrap("[", "](https://)", "link text"))}
                  {tool("Internal link", () => setPicker(true))}
                  <label style={{ ...btn.secondary, padding: "5px 9px", fontSize: 12 }}>
                    Image
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { uploadImage(e.target.files?.[0]); e.target.value = ""; }} />
                  </label>
                </>
              )}
            </div>
            {picker && view === "edit" && <LinkPicker data={data} onClose={() => setPicker(false)} onPick={(o) => { insert(`[${o.label}](${o.href})`); setPicker(false); }} />}
            {view === "edit" ? (
              <textarea ref={textRef} aria-label="Article body (Markdown)" value={form.body_md} onChange={set("body_md")} rows={24} style={{ ...inputStyle, fontFamily: "ui-monospace, Consolas, monospace", fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
            ) : (
              <div style={{ background: ADMIN_COLORS.white, border: `1px solid ${ADMIN_COLORS.borderGray}`, borderRadius: 8, padding: view === "mobile" ? 16 : 32, maxWidth: view === "mobile" ? 375 : 820, margin: "0 auto" }}>
                {form.hero_image_url && <img src={form.hero_image_url} alt={form.hero_image_alt} style={{ width: "100%", height: "auto", borderRadius: 8, marginBottom: 20 }} />}
                <h1 style={{ fontSize: view === "mobile" ? 26 : 36, color: ADMIN_COLORS.navy, lineHeight: 1.2 }}>{form.title || "Untitled"}</h1>
                <div className="tm-article-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(form.body_md) }} />
                <style>{ARTICLE_BODY_CSS}</style>
              </div>
            )}
            <div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray, marginTop: 6 }}>
              Markdown: ## heading, **bold**, *italic*, [text](url), - list, &gt; quote. {evaluation.analysis.wordCount} words — length should follow what the topic needs; there is no word-count target.
            </div>
          </div>

          <div style={{ ...card }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 4 }}>Sources</div>
            <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginBottom: 10 }}>Where each technical fact can be checked. Kept for review; not shown on the page.</div>
            {form.sources.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 6, marginBottom: 6 }}>
                <input aria-label="Source URL" style={inputStyle} value={s.url} placeholder="https://…" onChange={(e) => setForm((f) => ({ ...f, sources: f.sources.map((x, n) => (n === i ? { ...x, url: e.target.value } : x)) }))} />
                <input aria-label="Source note" style={inputStyle} value={s.title || ""} placeholder="What it supports" onChange={(e) => setForm((f) => ({ ...f, sources: f.sources.map((x, n) => (n === i ? { ...x, title: e.target.value } : x)) }))} />
                <button type="button" style={btn.danger} aria-label="Remove source" onClick={() => setForm((f) => ({ ...f, sources: f.sources.filter((_, n) => n !== i) }))}><Icon type="trash" size={13} /></button>
              </div>
            ))}
            <button type="button" style={btn.secondary} onClick={() => setForm((f) => ({ ...f, sources: [...f.sources, { url: "", title: "", note: "" }] }))}><Icon type="plus" size={13} /> Add source</button>
          </div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 6 }}>Search result preview</div>
            <SerpPreview title={meta.title} description={meta.description} url={`${SITE}/articles/${form.slug}`} />
          </div>
        </div>

        <aside style={{ display: "grid", gap: 14, position: "sticky", top: 16 }}>
          <div style={{ ...card }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: ADMIN_COLORS.navy }}>Quality checklist</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: ADMIN_COLORS.navy }}>{evaluation.score}%</div>
            </div>
            <div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray, margin: "4px 0 10px", lineHeight: 1.45 }}>{evaluation.scoreExplanation}</div>
            {Object.entries(GROUPS).map(([g, label]) => (
              <div key={g} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: ADMIN_COLORS.medGray, textTransform: "uppercase", letterSpacing: "0.04em", margin: "8px 0 4px" }}>{label}</div>
                {evaluation.checks.filter((c) => c.group === g).map((c) => (
                  <div key={c.id} style={{ padding: "6px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}`, fontSize: 12.5 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "flex-start", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{c.label}</span>
                      <StateBadge state={c.state} />
                    </div>
                    <div style={{ color: ADMIN_COLORS.medGray, fontSize: 12, marginTop: 2, lineHeight: 1.45 }}>{c.detail}</div>
                    {c.items?.length > 0 && (
                      <ul style={{ margin: "6px 0 0", padding: 0, listStyle: "none", display: "grid", gap: 4 }}>
                        {c.items.map((item, i) => (
                          <li key={i} style={{ fontSize: 12, lineHeight: 1.4, background: ADMIN_COLORS.dangerBg, borderRadius: 4, padding: "5px 7px" }}>
                            {item.line ? (
                              <button type="button" onClick={() => jumpToLine(item.line)} style={{ all: "unset", cursor: "pointer", fontWeight: 700, color: ADMIN_COLORS.danger, marginRight: 6 }} title="Select this line in the editor">
                                Line {item.line}
                              </button>
                            ) : (
                              <strong style={{ color: ADMIN_COLORS.danger, marginRight: 6 }}>{item.where}</strong>
                            )}
                            <code style={{ fontSize: 11.5, wordBreak: "break-word" }}>{item.text.length > 90 ? `${item.text.slice(0, 90)}…` : item.text}</code>
                            <div style={{ color: ADMIN_COLORS.medGray, fontSize: 11 }}>{item.reason}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {c.kind === "human" && (
                      <label style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4, fontSize: 12, cursor: "pointer" }}>
                        <input type="checkbox" checked={c.state === "pass"} onChange={() => toggleSignOff(c.id, c.state === "pass")} /> {c.stale ? "Reviewed the current text" : <>I&rsquo;ve reviewed this</>}
                      </label>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ ...card }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 4 }}>Internal link suggestions</div>
            <div style={{ fontSize: 11.5, color: ADMIN_COLORS.medGray, marginBottom: 8 }}>Pages this article mentions but doesn&rsquo;t link to yet.</div>
            {linkSuggestions.length === 0 ? <div style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray }}>None — mention a part number, brand or category to get suggestions.</div> : linkSuggestions.map((s) => (
              <div key={s.href} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", padding: "5px 0", borderTop: `1px solid ${ADMIN_COLORS.borderGray}` }}>
                <div style={{ fontSize: 12, minWidth: 0 }}><div style={{ fontWeight: 600 }}>{s.anchor}</div><div style={{ color: ADMIN_COLORS.medGray }}>{s.reason}</div></div>
                <button type="button" style={{ ...btn.secondary, padding: "4px 8px", fontSize: 12 }} onClick={() => { setView("edit"); insert(`[${s.anchor}](${s.href})`); }}>Insert</button>
              </div>
            ))}
          </div>

          <div style={{ ...card, display: "grid", gap: 8 }}>
            {busy && <div role="status" style={{ fontSize: 12.5, color: ADMIN_COLORS.medGray }}>{busy}</div>}
            <button type="button" style={btn.primary} onClick={save} disabled={!!busy || (!dirty && !!record)}>{isLive ? "Update live article" : "Save draft"}</button>
            {!isLive && (
              <>
                <button type="button" style={{ ...btn.secondary, ...(evaluation.canPublish ? { borderColor: ADMIN_COLORS.success, color: ADMIN_COLORS.success } : {}) }} onClick={publish} disabled={!!busy || !evaluation.canPublish}>Publish</button>
                {!evaluation.canPublish && (
                  <div style={{ fontSize: 12, lineHeight: 1.45, border: `1px solid ${ADMIN_COLORS.warning}`, background: ADMIN_COLORS.warningBg, borderRadius: 6, padding: 10 }}>
                    <div style={{ fontWeight: 700, color: ADMIN_COLORS.navy, marginBottom: 6 }}>
                      Before publishing — {evaluation.checks.filter((c) => c.state === "fail" || (c.kind === "human" && c.state !== "pass")).length} left:
                    </div>
                    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 6 }}>
                      {evaluation.checks.filter((c) => c.state === "fail").map((c) => (
                        <li key={c.id}>
                          <span style={{ color: ADMIN_COLORS.danger, fontWeight: 700 }}>Fix: </span>{c.label}
                          {c.items?.length > 0 && <span style={{ color: ADMIN_COLORS.medGray }}> ({c.items.length} — see the checklist)</span>}
                        </li>
                      ))}
                      {evaluation.checks.filter((c) => c.kind === "human" && c.state !== "pass").map((c) => (
                        <li key={c.id} style={{ display: "grid", gap: 4 }}>
                          <span>
                            <span style={{ color: ADMIN_COLORS.warning, fontWeight: 700 }}>{c.stale ? "Re-confirm: " : "Confirm: "}</span>{c.label}
                            {c.stale && <span style={{ color: ADMIN_COLORS.medGray }}> — the text changed after your last review</span>}
                          </span>
                          <button type="button" onClick={() => toggleSignOff(c.id, false)} style={{ ...btn.secondary, justifySelf: "start", padding: "4px 10px", fontSize: 12 }}>
                            I&rsquo;ve reviewed the current text
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div style={{ color: ADMIN_COLORS.medGray, fontSize: 11, marginTop: 6 }}>Confirmations are saved with the article and apply to this exact text.</div>
                  </div>
                )}
              </>
            )}
            {isLive && <button type="button" style={btn.secondary} onClick={unpublish} disabled={!!busy}>Unpublish</button>}
            {record && !isLive && <button type="button" style={btn.danger} onClick={remove} disabled={!!busy}>Delete draft</button>}
            {dirty && <div style={{ fontSize: 11.5, color: ADMIN_COLORS.warning }}>Unsaved changes.</div>}
          </div>
        </aside>
      </div>
      <style>{`@media (max-width: 960px) { .tm-article-editor { grid-template-columns: 1fr !important; } .tm-article-editor aside { position: static !important; } }`}</style>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MANUFACTURERS, PRODUCTS as CATEGORIES } from "../../data/content";
import { slugify } from "../../data/catalog/schema";
import { ADMIN_COLORS } from "../theme";
import PageHeader from "../components/PageHeader";
import AdminCard from "../components/AdminCard";
import { FormField, inputStyle } from "../components/FormField";
import TagInput from "../components/TagInput";
import Icon from "../../components/Icon";
import Button from "../../components/Button";

const EMPTY_PRODUCT = {
  manufacturer: "", category: "", series: "", partNumber: "", productName: "",
  shortDescription: "", longDescription: "", applications: [], industries: [],
  alternativePartNumbers: [], relatedProducts: [], status: "draft",
  seoTitle: "", seoDescription: "",
};

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [datasheetName, setDatasheetName] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    document.title = `${isEditing ? "Edit" : "Add"} Product | TradeMarco Admin`;
  }, [isEditing]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const slug = useMemo(() => slugify(form.partNumber), [form.partNumber]);
  const previewUrl = form.manufacturer && slug ? `/manufacturers/${form.manufacturer}/${slug}` : null;

  const handleSave = (status) => {
    // Phase 1 has no database — this validates and previews the record
    // shape a future POST /api/admin/products would receive.
    setForm((f) => ({ ...f, status }));
    setSaveMessage(status === "published"
      ? "Marked as Published (preview only — connect a database in Phase 2 to persist it)."
      : "Draft saved locally (preview only — connect a database in Phase 2 to persist it).");
  };

  return (
    <div>
      <PageHeader
        title={isEditing ? "Edit Product" : "Add Product"}
        description="Fields mirror the catalog CSV schema, so entries here and bulk imports stay consistent."
        actions={
          <Button variant="outline" onClick={() => navigate("/admin/products")} style={{ padding: "10px 18px", fontSize: 13 }}>
            Cancel
          </Button>
        }
      />

      {saveMessage && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.success, background: ADMIN_COLORS.successBg, padding: "10px 14px", borderRadius: 6, marginBottom: 20 }}>
          <Icon type="check" size={15} color={ADMIN_COLORS.success} />
          {saveMessage}
        </div>
      )}

      <div className="tm-pe-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AdminCard title="Identification">
            <div className="tm-pe-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Manufacturer" required>
                <select style={inputStyle} value={form.manufacturer} onChange={set("manufacturer")}>
                  <option value="">Select manufacturer…</option>
                  {MANUFACTURERS.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                </select>
              </FormField>
              <FormField label="Category" required>
                <select style={inputStyle} value={form.category} onChange={set("category")}>
                  <option value="">Select category…</option>
                  {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
                </select>
              </FormField>
              <FormField label="Series">
                <input style={inputStyle} value={form.series} onChange={set("series")} placeholder="e.g. DVC6200" />
              </FormField>
              <FormField label="Part Number" required>
                <input style={inputStyle} value={form.partNumber} onChange={set("partNumber")} placeholder="e.g. DVC6200-D1" />
              </FormField>
            </div>
            <div style={{ marginTop: 16 }}>
              <FormField label="Product Name" required>
                <input style={inputStyle} value={form.productName} onChange={set("productName")} placeholder="e.g. DVC6200 Digital Valve Controller" />
              </FormField>
            </div>
          </AdminCard>

          <AdminCard title="Description">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="Short Description" required hint="One or two sentences, shown on cards and search results.">
                <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.shortDescription} onChange={set("shortDescription")} />
              </FormField>
              <FormField label="Long Description" hint="Shown on the product detail page. Falls back to the short description if left blank.">
                <textarea style={{ ...inputStyle, minHeight: 130, resize: "vertical" }} value={form.longDescription} onChange={set("longDescription")} />
              </FormField>
            </div>
          </AdminCard>

          <AdminCard title="Applications & Cross-References">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="Applications" hint="Press Enter to add each one.">
                <TagInput value={form.applications} onChange={(v) => setForm((f) => ({ ...f, applications: v }))} placeholder="e.g. Flow control" />
              </FormField>
              <FormField label="Industries" hint="Press Enter to add each one.">
                <TagInput value={form.industries} onChange={(v) => setForm((f) => ({ ...f, industries: v }))} placeholder="e.g. Oil & Gas" />
              </FormField>
              <FormField label="Alternative Part Numbers" hint="OEM or cross-reference part numbers.">
                <TagInput value={form.alternativePartNumbers} onChange={(v) => setForm((f) => ({ ...f, alternativePartNumbers: v }))} placeholder="e.g. DVC6200SIS" />
              </FormField>
              <FormField label="Related Products" hint='Format: manufacturer-slug/product-slug, e.g. "emerson/3051s".'>
                <TagInput value={form.relatedProducts} onChange={(v) => setForm((f) => ({ ...f, relatedProducts: v }))} placeholder="e.g. emerson/3051s" />
              </FormField>
            </div>
          </AdminCard>

          <AdminCard title="Datasheet">
            <FormField label="Datasheet Upload (PDF)" hint="File storage isn't connected yet in Phase 1 — this captures the filename only.">
              <label style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1.5px dashed ${ADMIN_COLORS.border}`,
                borderRadius: 6, cursor: "pointer", fontSize: 13, color: ADMIN_COLORS.medGray,
              }}>
                <Icon type="upload" size={16} color={ADMIN_COLORS.medGray} />
                {datasheetName || "Choose PDF file…"}
                <input type="file" accept="application/pdf" style={{ display: "none" }} onChange={(e) => setDatasheetName(e.target.files?.[0]?.name || "")} />
              </label>
            </FormField>
          </AdminCard>

          <AdminCard title="SEO">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="SEO Title" hint="Defaults to a generated title if left blank.">
                <input style={inputStyle} value={form.seoTitle} onChange={set("seoTitle")} placeholder={form.productName ? `${form.productName} | TradeMarco` : ""} />
              </FormField>
              <FormField label="SEO Description" hint="Defaults to the short description if left blank.">
                <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.seoDescription} onChange={set("seoDescription")} />
              </FormField>
            </div>
          </AdminCard>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AdminCard title="Publish">
            <FormField label="Status">
              <select style={inputStyle} value={form.status} onChange={set("status")}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
              <Button variant="primary" onClick={() => handleSave("published")} style={{ width: "100%", justifyContent: "center" }}>
                Publish
              </Button>
              <Button variant="outline" onClick={() => handleSave("draft")} style={{ width: "100%", justifyContent: "center" }}>
                Save Draft
              </Button>
            </div>
          </AdminCard>

          <AdminCard title="Slug & Preview URL">
            <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginBottom: 6 }}>Slug (auto-generated)</div>
            <div style={{ fontSize: 13, fontFamily: "monospace", color: ADMIN_COLORS.navy, background: ADMIN_COLORS.contentBg, padding: "8px 10px", borderRadius: 6, marginBottom: 14, wordBreak: "break-all" }}>
              {slug || "—"}
            </div>
            <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray, marginBottom: 6 }}>Preview URL</div>
            {previewUrl ? (
              <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: ADMIN_COLORS.accent, wordBreak: "break-all" }}>
                {previewUrl}
              </a>
            ) : (
              <div style={{ fontSize: 13, color: ADMIN_COLORS.medGray }}>Select a manufacturer and enter a part number.</div>
            )}
          </AdminCard>
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .tm-pe-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .tm-pe-2col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

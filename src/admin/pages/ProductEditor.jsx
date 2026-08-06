import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listManufacturers } from "../../lib/supabase/manufacturers";
import { listCategories } from "../../lib/supabase/categories";
import {
  getProduct, getRelatedProductRefs, createProduct, updateProduct,
  resolveProductRef, setRelatedProducts,
} from "../../lib/supabase/products";
import { uploadProductImage, uploadDatasheet } from "../../lib/supabase/storage";
import { slugify } from "../../data/catalog/schema";
import { ADMIN_COLORS } from "../theme";
import PageHeader from "../components/PageHeader";
import AdminCard from "../components/AdminCard";
import { FormField, inputStyle } from "../components/FormField";
import TagInput from "../components/TagInput";
import Icon from "../../components/Icon";
import Button from "../../components/Button";

const EMPTY_FORM = {
  manufacturerId: "", categoryId: "", series: "", partNumber: "", productName: "",
  price: "", size: "", rating: "", type: "",
  shortDescription: "", longDescription: "", applications: [], industries: [],
  alternativePartNumbers: [], relatedProducts: [], rfqAvailable: true,
  imageUrl: "", datasheetUrl: "", status: "draft", seoTitle: "", seoDescription: "",
};

export default function ProductEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDatasheet, setUploadingDatasheet] = useState(false);

  useEffect(() => {
    document.title = `${isEditing ? "Edit" : "Add"} Product | Trademarco Global Admin`;
  }, [isEditing]);

  useEffect(() => {
    listManufacturers().then(setManufacturers).catch(() => {});
    listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    Promise.all([getProduct(id), getRelatedProductRefs(id)])
      .then(([product, relatedRefs]) => {
        if (cancelled) return;
        if (!product) {
          setLoadError("Product not found.");
          return;
        }
        setForm({
          manufacturerId: product.manufacturer_id,
          categoryId: product.category_id,
          series: product.series ?? "",
          partNumber: product.part_number,
          price: product.price ?? "",
          size: product.size ?? "",
          rating: product.rating ?? "",
          type: product.type ?? "",
          productName: product.product_name,
          shortDescription: product.short_description,
          longDescription: product.long_description ?? "",
          applications: product.applications ?? [],
          industries: product.industries ?? [],
          alternativePartNumbers: product.alternative_part_numbers ?? [],
          relatedProducts: relatedRefs,
          rfqAvailable: product.rfq_available,
          imageUrl: product.image_url ?? "",
          datasheetUrl: product.datasheet_url ?? "",
          status: product.status,
          seoTitle: product.seo_title ?? "",
          seoDescription: product.seo_description ?? "",
        });
      })
      .catch((err) => { if (!cancelled) setLoadError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id, isEditing]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const slug = useMemo(() => slugify(form.partNumber), [form.partNumber]);
  const selectedManufacturer = manufacturers.find((m) => m.id === form.manufacturerId);
  const previewUrl = selectedManufacturer && slug ? `/manufacturers/${selectedManufacturer.slug}/${slug}` : null;

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    try {
      const url = await uploadProductImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      window.alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDatasheetUpload = async (file) => {
    if (!file) return;
    setUploadingDatasheet(true);
    try {
      const url = await uploadDatasheet(file);
      setForm((f) => ({ ...f, datasheetUrl: url }));
    } catch (err) {
      window.alert(`Datasheet upload failed: ${err.message}`);
    } finally {
      setUploadingDatasheet(false);
    }
  };

  const handleSave = async (status) => {
    setSaveError("");
    setSaveMessage("");

    if (!form.manufacturerId || !form.categoryId || !form.partNumber.trim() || !form.productName.trim() || !form.shortDescription.trim()) {
      setSaveError("Manufacturer, Category, Part Number, Product Name and Short Description are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        manufacturer_id: form.manufacturerId,
        category_id: form.categoryId,
        series: form.series.trim() || null,
        slug,
        part_number: form.partNumber.trim(),
        price: form.price !== "" && !Number.isNaN(Number(form.price)) ? Number(form.price) : null,
        size: form.size.trim() || null,
        rating: form.rating.trim() || null,
        type: form.type.trim() || null,
        product_name: form.productName.trim(),
        short_description: form.shortDescription.trim(),
        long_description: form.longDescription.trim() || null,
        applications: form.applications,
        industries: form.industries,
        alternative_part_numbers: form.alternativePartNumbers,
        rfq_available: form.rfqAvailable,
        image_url: form.imageUrl || null,
        datasheet_url: form.datasheetUrl || null,
        seo_title: form.seoTitle.trim() || null,
        seo_description: form.seoDescription.trim() || null,
        status,
      };

      const saved = isEditing ? await updateProduct(id, payload) : await createProduct(payload);

      const relatedIds = (await Promise.all(form.relatedProducts.map(resolveProductRef))).filter(Boolean);
      await setRelatedProducts(saved.id, relatedIds);

      setForm((f) => ({ ...f, status }));
      setSaveMessage(status === "published" ? "Product published — now live on the public site." : "Draft saved.");

      if (!isEditing) {
        navigate(`/admin/products/${saved.id}/edit`, { replace: true });
      }
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "60px 0", textAlign: "center", color: ADMIN_COLORS.medGray, fontSize: 13 }}>Loading product&hellip;</div>;
  }

  if (loadError) {
    return (
      <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center" }}>
        <p style={{ fontSize: 14, color: ADMIN_COLORS.danger, marginBottom: 20 }}>{loadError}</p>
        <Button variant="outline" onClick={() => navigate("/admin/products")} style={{ padding: "10px 18px", fontSize: 13 }}>
          Back to Products
        </Button>
      </div>
    );
  }

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
      {saveError && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6, marginBottom: 20 }}>
          <Icon type="alert-triangle" size={15} color={ADMIN_COLORS.danger} />
          {saveError}
        </div>
      )}

      <div className="tm-pe-grid" style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <AdminCard title="Identification">
            <div className="tm-pe-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Manufacturer" required>
                <select style={inputStyle} value={form.manufacturerId} onChange={set("manufacturerId")}>
                  <option value="">Select manufacturer…</option>
                  {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </FormField>
              <FormField label="Category" required>
                <select style={inputStyle} value={form.categoryId} onChange={set("categoryId")}>
                  <option value="">Select category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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

          <AdminCard title="Specifications">
            <div className="tm-pe-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <FormField label="Price" hint="Numeric value only, e.g. 249.00">
                <input style={inputStyle} type="number" step="0.01" value={form.price} onChange={set("price")} placeholder="e.g. 249.00" />
              </FormField>
              <FormField label="Size">
                <input style={inputStyle} value={form.size} onChange={set("size")} placeholder="e.g. DN50 / 2 in" />
              </FormField>
              <FormField label="Rating" hint="e.g. pressure or temperature class.">
                <input style={inputStyle} value={form.rating} onChange={set("rating")} placeholder="e.g. Class 150" />
              </FormField>
              <FormField label="Type">
                <input style={inputStyle} value={form.type} onChange={set("type")} placeholder="e.g. Flanged" />
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
              <FormField label="Related Products" hint='Format: manufacturer-slug/product-slug, e.g. "emerson/3051s". Must already exist.'>
                <TagInput value={form.relatedProducts} onChange={(v) => setForm((f) => ({ ...f, relatedProducts: v }))} placeholder="e.g. emerson/3051s" />
              </FormField>
            </div>
          </AdminCard>

          <AdminCard title="Media">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="Product Image">
                <label style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1.5px dashed ${ADMIN_COLORS.border}`,
                  borderRadius: 6, cursor: uploadingImage ? "default" : "pointer", fontSize: 13, color: ADMIN_COLORS.medGray,
                }}>
                  <Icon type="upload" size={16} color={ADMIN_COLORS.medGray} />
                  {uploadingImage ? "Uploading…" : form.imageUrl ? "Image uploaded — choose to replace" : "Choose image file…"}
                  <input type="file" accept="image/*" style={{ display: "none" }} disabled={uploadingImage}
                    onChange={(e) => handleImageUpload(e.target.files?.[0])} />
                </label>
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="Product preview" style={{ marginTop: 10, maxHeight: 100, borderRadius: 6, border: `1px solid ${ADMIN_COLORS.border}` }} />
                )}
              </FormField>
              <FormField label="Datasheet (PDF)">
                <label style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: `1.5px dashed ${ADMIN_COLORS.border}`,
                  borderRadius: 6, cursor: uploadingDatasheet ? "default" : "pointer", fontSize: 13, color: ADMIN_COLORS.medGray,
                }}>
                  <Icon type="upload" size={16} color={ADMIN_COLORS.medGray} />
                  {uploadingDatasheet ? "Uploading…" : form.datasheetUrl ? "Datasheet uploaded — choose to replace" : "Choose PDF file…"}
                  <input type="file" accept="application/pdf" style={{ display: "none" }} disabled={uploadingDatasheet}
                    onChange={(e) => handleDatasheetUpload(e.target.files?.[0])} />
                </label>
                {form.datasheetUrl && (
                  <a href={form.datasheetUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 12, color: ADMIN_COLORS.accent }}>
                    View uploaded datasheet
                  </a>
                )}
              </FormField>
            </div>
          </AdminCard>

          <AdminCard title="SEO">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <FormField label="SEO Title" hint="Defaults to a generated title if left blank.">
                <input style={inputStyle} value={form.seoTitle} onChange={set("seoTitle")} placeholder={form.productName ? `${form.productName} | Trademarco Global` : ""} />
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
              <Button variant="primary" disabled={saving} onClick={() => handleSave("published")} style={{ width: "100%", justifyContent: "center", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Publish"}
              </Button>
              <Button variant="outline" disabled={saving} onClick={() => handleSave("draft")} style={{ width: "100%", justifyContent: "center", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save Draft"}
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

import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import Modal from "../components/Modal";
import { FormField, inputStyle } from "../components/FormField";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { ADMIN_COLORS } from "../theme";
import { listManufacturers, createManufacturer, updateManufacturer, deleteManufacturer } from "../../lib/supabase/manufacturers";
import { uploadManufacturerLogo } from "../../lib/supabase/storage";
import { slugify } from "../../data/catalog/schema";

// Same chip the public site puts a logo on, so what the admin sees here is
// what visitors will see.
function LogoChip({ url, dark, width = 96, height = 40 }) {
  return (
    <div style={{
      width, height, flexShrink: 0, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
      background: dark ? "#1B2A4A" : "#FFFFFF", border: `1px solid ${ADMIN_COLORS.borderGray}`, padding: 6, boxSizing: "border-box",
    }}>
      {url
        ? <img src={url} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        : <span style={{ fontSize: 11, color: ADMIN_COLORS.medGray }}>No logo</span>}
    </div>
  );
}

const COLUMNS = [
  { key: "logo_url", label: "Logo", sortable: false, render: (row) => <LogoChip url={row.logo_url} dark={row.logo_dark} /> },
  { key: "name", label: "Manufacturer Name" },
  { key: "description", label: "Description", wrap: true },
  {
    key: "website", label: "Website", sortable: false,
    render: (row) => row.website
      ? <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ color: ADMIN_COLORS.accent }}>{row.website.replace(/^https?:\/\//, "")}</a>
      : <span style={{ color: ADMIN_COLORS.medGray }}>—</span>,
  },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

const EMPTY_FORM = { name: "", description: "", website: "", logo_url: "", logo_dark: false, seo_title: "", seo_description: "", status: "active" };

export default function AdminManufacturers() {
  useEffect(() => { document.title = "Manufacturers | Trademarco Global Admin"; }, []);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    setError("");
    listManufacturers().then(setRows).catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name, description: row.description ?? "", website: row.website ?? "",
      logo_url: row.logo_url ?? "", logo_dark: !!row.logo_dark, seo_title: row.seo_title ?? "", seo_description: row.seo_description ?? "",
      status: row.status,
    });
    setFormError("");
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleLogoFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // so picking the same file again still fires
    if (!file) return;
    if (!file.type.startsWith("image/")) { setFormError("Logo must be an image (PNG, WebP, JPG or SVG)."); return; }
    setUploading(true);
    setFormError("");
    try {
      const url = await uploadManufacturerLogo(file);
      setForm((f) => ({ ...f, logo_url: url }));
    } catch (err) {
      setFormError(`Logo upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      // The slug is fixed at creation. Re-deriving it on every save meant
      // correcting a typo in a brand name silently moved the brand page and
      // every one of its product URLs, orphaning whatever Google had indexed.
      const payload = { ...form, name: form.name.trim(), slug: editing ? editing.slug : slugify(form.name) };
      if (editing) await updateManufacturer(editing.id, payload);
      else await createManufacturer(payload);
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.name}"? Products linked to it must be removed or reassigned first.`)) return;
    try {
      await deleteManufacturer(row.id);
      load();
    } catch (err) {
      window.alert(`Could not delete: ${err.message}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Manufacturers"
        description="Brands sourced through Trademarco Global. Feeds the public Manufacturers page directly from Supabase."
        actions={
          <Button variant="primary" onClick={openAdd} style={{ padding: "10px 20px", fontSize: 13 }}>
            <Icon type="plus" size={16} color={ADMIN_COLORS.white} /> Add Manufacturer
          </Button>
        }
      />

      {error && (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>
          Could not load manufacturers: {error}
        </div>
      )}

      {rows === null && !error ? (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.medGray, padding: "40px 0", textAlign: "center" }}>Loading manufacturers&hellip;</div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows ?? []}
          searchPlaceholder="Search manufacturers…"
          searchKeys={["name", "description"]}
          filters={[{ key: "status", label: "All Statuses", options: [
            { value: "active", label: "Active" }, { value: "draft", label: "Draft" }, { value: "archived", label: "Archived" },
          ] }]}
          actions={(row) => <RowActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />}
          emptyMessage="No manufacturers yet."
        />
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Edit Manufacturer" : "Add Manufacturer"}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={saving || uploading} style={{ padding: "10px 18px", fontSize: 13, opacity: saving || uploading ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && <div style={{ fontSize: 12, color: ADMIN_COLORS.danger }}>{formError}</div>}
            <FormField label="Name" required><input style={inputStyle} value={form.name} onChange={set("name")} /></FormField>
            <FormField label="Description"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.description} onChange={set("description")} /></FormField>
            <FormField label="Website"><input style={inputStyle} value={form.website} onChange={set("website")} placeholder="https://…" /></FormField>
            <FormField label="Logo" hint="PNG with a transparent background works best. Resized and converted to WebP on upload; SVG is kept as is.">
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <LogoChip url={form.logo_url} dark={form.logo_dark} width={180} height={72} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{
                    display: "inline-flex", alignItems: "center", gap: 6, cursor: uploading ? "wait" : "pointer",
                    fontSize: 13, fontWeight: 600, color: ADMIN_COLORS.accent, opacity: uploading ? 0.6 : 1,
                  }}>
                    <Icon type="upload" size={16} color={ADMIN_COLORS.accent} />
                    {uploading ? "Uploading…" : form.logo_url ? "Replace logo" : "Upload logo"}
                    <input type="file" accept="image/png,image/webp,image/jpeg,image/svg+xml" onChange={handleLogoFile} disabled={uploading} style={{ display: "none" }} />
                  </label>
                  {form.logo_url && !uploading && (
                    <button type="button" onClick={() => setForm((f) => ({ ...f, logo_url: "" }))}
                      style={{ all: "unset", cursor: "pointer", fontSize: 12, color: ADMIN_COLORS.danger }}>
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginTop: 10, cursor: "pointer" }}>
                <input type="checkbox" checked={form.logo_dark} onChange={(e) => setForm((f) => ({ ...f, logo_dark: e.target.checked }))} />
                Show on a dark background (for white or light logos)
              </label>
              <input style={{ ...inputStyle, marginTop: 10, fontSize: 12 }} value={form.logo_url} onChange={set("logo_url")}
                placeholder="…or paste a path / URL, e.g. /images/products/logosm/example.webp" />
            </FormField>
            <FormField label="SEO Title"><input style={inputStyle} value={form.seo_title} onChange={set("seo_title")} /></FormField>
            <FormField label="SEO Description"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.seo_description} onChange={set("seo_description")} /></FormField>
            <FormField label="Status">
              <select style={inputStyle} value={form.status} onChange={set("status")}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}

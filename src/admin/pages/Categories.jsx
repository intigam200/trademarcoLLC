import { useCallback, useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import Modal from "../components/Modal";
import TagInput from "../components/TagInput";
import { FormField, inputStyle } from "../components/FormField";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { ADMIN_COLORS } from "../theme";
import { listCategories, createCategory, updateCategory, deleteCategory } from "../../lib/supabase/categories";
import { slugify } from "../../data/catalog/schema";

const COLUMNS = [
  { key: "name", label: "Category Name" },
  { key: "description", label: "Description", wrap: true },
  { key: "parent_name", label: "Parent Category", render: (row) => row.parent_name || <span style={{ color: ADMIN_COLORS.medGray }}>— Top level —</span> },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

const EMPTY_FORM = { name: "", description: "", full_description: "", image_url: "", types: [], parent_id: "", seo_title: "", seo_description: "", status: "active" };

export default function AdminCategories() {
  useEffect(() => { document.title = "Categories | Trademarco Global Admin"; }, []);
  const [categories, setCategories] = useState(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(() => {
    setError("");
    listCategories().then(setCategories).catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = (categories ?? []).map((c) => ({
    ...c,
    parent_name: categories?.find((p) => p.id === c.parent_id)?.name ?? "",
  }));

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setModalOpen(true); };
  const openEdit = (row) => {
    setEditing(row);
    setForm({
      name: row.name, description: row.description ?? "", full_description: row.full_description ?? "",
      image_url: row.image_url ?? "", types: row.types ?? [], parent_id: row.parent_id ?? "",
      seo_title: row.seo_title ?? "", seo_description: row.seo_description ?? "", status: row.status,
    });
    setFormError("");
    setModalOpen(true);
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form, name: form.name.trim(), slug: slugify(form.name), parent_id: form.parent_id || null };
      if (editing) await updateCategory(editing.id, payload);
      else await createCategory(payload);
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
      await deleteCategory(row.id);
      load();
    } catch (err) {
      window.alert(`Could not delete: ${err.message}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Product categories used across the catalog, imports and the public Products explorer — backed by Supabase."
        actions={
          <Button variant="primary" onClick={openAdd} style={{ padding: "10px 20px", fontSize: 13 }}>
            <Icon type="plus" size={16} color={ADMIN_COLORS.white} /> Add Category
          </Button>
        }
      />

      {error && (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>
          Could not load categories: {error}
        </div>
      )}

      {categories === null && !error ? (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.medGray, padding: "40px 0", textAlign: "center" }}>Loading categories&hellip;</div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rows}
          searchPlaceholder="Search categories…"
          searchKeys={["name", "description"]}
          actions={(row) => <RowActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />}
          emptyMessage="No categories yet."
        />
      )}

      {modalOpen && (
        <Modal
          title={editing ? "Edit Category" : "Add Category"}
          onClose={() => setModalOpen(false)}
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)} style={{ padding: "10px 18px", fontSize: 13 }}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit} disabled={saving} style={{ padding: "10px 18px", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {formError && <div style={{ fontSize: 12, color: ADMIN_COLORS.danger }}>{formError}</div>}
            <FormField label="Name" required><input style={inputStyle} value={form.name} onChange={set("name")} /></FormField>
            <FormField label="Description" hint="Short summary shown on category cards."><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.description} onChange={set("description")} /></FormField>
            <FormField label="Full Description" hint="Longer copy shown on the Products explorer page."><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.full_description} onChange={set("full_description")} /></FormField>
            <FormField label="Image URL"><input style={inputStyle} value={form.image_url} onChange={set("image_url")} placeholder="/images/products/example.png" /></FormField>
            <FormField label="Types / Subcategories" hint="Press Enter to add each one.">
              <TagInput value={form.types} onChange={(v) => setForm((f) => ({ ...f, types: v }))} placeholder="e.g. Gate Valves" />
            </FormField>
            <FormField label="Parent Category">
              <select style={inputStyle} value={form.parent_id} onChange={set("parent_id")}>
                <option value="">— Top level —</option>
                {(categories ?? []).filter((c) => c.id !== editing?.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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

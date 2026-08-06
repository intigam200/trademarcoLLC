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
import { slugify } from "../../data/catalog/schema";

const COLUMNS = [
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

const EMPTY_FORM = { name: "", description: "", website: "", logo_url: "", seo_title: "", seo_description: "", status: "active" };

export default function AdminManufacturers() {
  useEffect(() => { document.title = "Manufacturers | TradeMarco Admin"; }, []);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

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
      logo_url: row.logo_url ?? "", seo_title: row.seo_title ?? "", seo_description: row.seo_description ?? "",
      status: row.status,
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
      const payload = { ...form, name: form.name.trim(), slug: slugify(form.name) };
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
        description="Brands sourced through TradeMarco. Feeds the public Manufacturers page directly from Supabase."
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
              <Button variant="primary" onClick={handleSubmit} disabled={saving} style={{ padding: "10px 18px", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
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
            <FormField label="Logo URL" hint="Path or URL to a logo image.">
              <input style={inputStyle} value={form.logo_url} onChange={set("logo_url")} placeholder="/images/products/logosm/example.png" />
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

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
import { listRFQs, updateRFQ, deleteRFQ, rfqsToCSV } from "../../lib/supabase/rfqs";

const STATUS_OPTIONS = [
  { value: "unread", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "quoted", label: "Quoted" },
  { value: "closed", label: "Closed" },
];

const COLUMNS = [
  {
    key: "request_id", label: "Request ID",
    render: (row) => <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.navy }}>{row.request_id || row.id.slice(0, 8)}</span>,
  },
  { key: "company", label: "Company", render: (row) => row.company || <span style={{ color: ADMIN_COLORS.medGray }}>—</span> },
  { key: "contact_name", label: "Contact" },
  { key: "email", label: "Email", wrap: true },
  {
    key: "product_label", label: "Requested Product", wrap: true,
    render: (row) => row.product_label || <span style={{ color: ADMIN_COLORS.medGray }}>—</span>,
  },
  { key: "part_number", label: "Part Number", render: (row) => row.part_number || <span style={{ color: ADMIN_COLORS.medGray }}>—</span> },
  {
    key: "created_at", label: "Submitted",
    render: (row) => new Date(row.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }),
  },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminRFQs() {
  useEffect(() => { document.title = "RFQs | Trademarco Global Admin"; }, []);
  const [rfqs, setRfqs] = useState(null);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(null);
  const [statusDraft, setStatusDraft] = useState("unread");
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setError("");
    listRFQs()
      .then((data) => setRfqs(data.map((r) => ({ ...r, product_label: r.product_name || r.product_text || "" }))))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openView = (row) => {
    setViewing(row);
    setStatusDraft(row.status);
    setNotesDraft(row.notes || "");
  };

  const handleSave = async () => {
    if (!viewing) return;
    setSaving(true);
    try {
      await updateRFQ(viewing.id, { status: statusDraft, notes: notesDraft.trim() || null });
      setViewing(null);
      load();
    } catch (err) {
      window.alert(`Could not save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete the RFQ from ${row.contact_name}? This cannot be undone.`)) return;
    try {
      await deleteRFQ(row.id);
      load();
    } catch (err) {
      window.alert(`Could not delete: ${err.message}`);
    }
  };

  const handleExport = () => {
    if (!rfqs || rfqs.length === 0) return;
    downloadBlob(rfqsToCSV(rfqs), `rfqs-export-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div>
      <PageHeader
        title="RFQs"
        description="Requests for quote — submitted through the public site, validated and spam-checked server-side, and stored in Supabase."
        actions={
          <Button variant="outline" onClick={handleExport} disabled={!rfqs || rfqs.length === 0} style={{ padding: "10px 20px", fontSize: 13 }}>
            <Icon type="download" size={16} color={ADMIN_COLORS.navy} /> Export CSV
          </Button>
        }
      />

      {error && (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>
          Could not load RFQs: {error}
        </div>
      )}

      {rfqs === null && !error ? (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.medGray, padding: "40px 0", textAlign: "center" }}>Loading RFQs&hellip;</div>
      ) : (
        <DataTable
          columns={COLUMNS}
          rows={rfqs ?? []}
          searchPlaceholder="Search by request ID, company, contact, email, product, part number…"
          searchKeys={["request_id", "company", "contact_name", "email", "product_label", "part_number", "id"]}
          filters={[{ key: "status", label: "All Statuses", options: STATUS_OPTIONS }]}
          actions={(row) => <RowActions onView={() => openView(row)} onDelete={() => handleDelete(row)} />}
          emptyMessage="No RFQs yet — they'll appear here as visitors submit the RFQ form."
        />
      )}

      {viewing && (
        <Modal
          title={`${viewing.request_id || `RFQ ${viewing.id.slice(0, 8)}`} — ${viewing.contact_name}`}
          onClose={() => setViewing(null)}
          footer={
            <>
              <Button variant="outline" onClick={() => setViewing(null)} style={{ padding: "10px 18px", fontSize: 13 }}>Close</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving} style={{ padding: "10px 18px", fontSize: 13, opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
            <Row label="Request ID" value={viewing.request_id} />
            <Row label="Submitted" value={new Date(viewing.created_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })} />
            <Row label="Company" value={viewing.company} />
            <Row label="Contact" value={viewing.contact_name} />
            <Row label="Email" value={viewing.email} />
            <Row label="Phone" value={viewing.phone} />
            <Row label="Country" value={viewing.country} />
            <Row label="Manufacturer" value={viewing.manufacturer_name} />
            <Row label="Product" value={viewing.product_name || viewing.product_text} />
            <Row label="Part Number" value={viewing.part_number} />
            <Row label="Message" value={viewing.message} block />
            {viewing.page_url && (
              <Row label="Page URL" block value={
                <a href={viewing.page_url} target="_blank" rel="noopener noreferrer" style={{ color: ADMIN_COLORS.accent, wordBreak: "break-all" }}>
                  {viewing.page_url}
                </a>
              } />
            )}
            <Row label="IP Address" value={viewing.ip_address} />
            <Row label="User Agent" value={viewing.user_agent} block />

            <FormField label="Status">
              <select style={inputStyle} value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </FormField>
            <FormField label="Internal Notes" hint="Not visible to the customer.">
              <textarea
                style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="e.g. Quoted $4,200 on 8/6, awaiting PO…"
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Row({ label, value, block }) {
  return (
    <div style={block ? {} : { display: "flex", justifyContent: "space-between", gap: 12 }}>
      <span style={{ color: ADMIN_COLORS.medGray, flexShrink: 0 }}>{label}</span>
      <span style={{ color: ADMIN_COLORS.darkGray, textAlign: block ? "left" : "right", marginTop: block ? 4 : 0, display: block ? "block" : "inline", whiteSpace: block ? "pre-line" : "normal", wordBreak: "break-word" }}>
        {value || "—"}
      </span>
    </div>
  );
}

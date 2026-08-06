import { supabase } from "./client";

// manufacturer_name/product_name/part_number are denormalized snapshots
// captured at submission time (see api/rfq.js) — no join needed to display
// them, and they stay accurate even if the underlying product is later
// edited or deleted.
export async function listRFQs({ status } = {}) {
  let query = supabase.from("rfqs").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

// Used by the admin RFQs detail panel to save status and/or notes together
// in a single round trip (fields is a partial { status?, notes? }).
export async function updateRFQ(id, fields) {
  const { data, error } = await supabase.from("rfqs").update(fields).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRFQ(id) {
  const { error } = await supabase.from("rfqs").delete().eq("id", id);
  if (error) throw error;
}

export async function countRFQs({ status } = {}) {
  let query = supabase.from("rfqs").select("*", { count: "exact", head: true });
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

// RFQ submissions are no longer written by the browser directly — they go
// through POST /api/rfq (server-side validation, spam check via Turnstile,
// IP/user-agent capture, email notifications), which uses the Supabase
// service role key. The anon client has no INSERT policy on rfqs anymore
// (see supabase/schema.sql), so a direct client-side insert would fail.

const CSV_COLUMNS = [
  ["request_id", "Request ID"], ["created_at", "Submitted"], ["status", "Status"],
  ["contact_name", "Contact Name"], ["company", "Company"], ["email", "Email"],
  ["phone", "Phone"], ["country", "Country"], ["manufacturer_name", "Manufacturer"],
  ["product_label", "Product"], ["part_number", "Part Number"], ["message", "Message"],
  ["page_url", "Page URL"], ["ip_address", "IP Address"], ["notes", "Notes"],
];

// Used by the admin RFQs page's "Export CSV" button.
export function rfqsToCSV(rows) {
  const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [CSV_COLUMNS.map(([, label]) => escape(label)).join(",")];
  for (const row of rows) {
    lines.push(CSV_COLUMNS.map(([key]) => escape(row[key])).join(","));
  }
  return new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
}

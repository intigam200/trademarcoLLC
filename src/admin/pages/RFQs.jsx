import { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import { MOCK_RFQS } from "../data/mock";

const COLUMNS = [
  { key: "id", label: "RFQ ID" },
  { key: "company", label: "Company" },
  { key: "contact", label: "Contact" },
  { key: "country", label: "Country" },
  { key: "product", label: "Requested Product", wrap: true },
  { key: "date", label: "Date" },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

export default function AdminRFQs() {
  useEffect(() => { document.title = "RFQs | TradeMarco Admin"; }, []);

  return (
    <div>
      <PageHeader
        title="RFQs"
        description="Requests for quote submitted through the public site. Sample data shown — not yet wired to a live RFQ store (submissions currently arrive by email via api/contact.js)."
      />
      <DataTable
        columns={COLUMNS}
        rows={MOCK_RFQS}
        searchPlaceholder="Search by company, contact, product…"
        searchKeys={["company", "contact", "product", "id"]}
        filters={[{ key: "status", label: "All Statuses", options: [
          { value: "new", label: "New" },
          { value: "quoted", label: "Quoted" },
          { value: "closed", label: "Closed" },
        ] }]}
        actions={() => <RowActions onView={() => {}} />}
        emptyMessage="No RFQs found."
      />
    </div>
  );
}

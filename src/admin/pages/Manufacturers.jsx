import { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { ADMIN_COLORS } from "../theme";
import { MOCK_MANUFACTURERS } from "../data/mock";

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

export default function AdminManufacturers() {
  useEffect(() => { document.title = "Manufacturers | TradeMarco Admin"; }, []);

  return (
    <div>
      <PageHeader
        title="Manufacturers"
        description="Brands sourced through TradeMarco. Logo, website and SEO fields feed the public Manufacturers page. Sample rows shown — connect a database in Phase 2 to manage the real list here."
        actions={
          <Button variant="primary" style={{ padding: "10px 20px", fontSize: 13 }}>
            <Icon type="plus" size={16} color={ADMIN_COLORS.white} /> Add Manufacturer
          </Button>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={MOCK_MANUFACTURERS}
        searchPlaceholder="Search manufacturers…"
        searchKeys={["name", "description"]}
        filters={[{ key: "status", label: "All Statuses", options: [{ value: "active", label: "Active" }, { value: "draft", label: "Draft" }] }]}
        actions={() => <RowActions onEdit={() => {}} onDelete={() => {}} />}
        emptyMessage="No manufacturers found."
      />
    </div>
  );
}

import { useEffect } from "react";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { ADMIN_COLORS } from "../theme";
import { MOCK_CATEGORIES } from "../data/mock";

const COLUMNS = [
  { key: "name", label: "Category Name" },
  { key: "description", label: "Description", wrap: true },
  {
    key: "parent", label: "Parent Category",
    render: (row) => row.parent || <span style={{ color: ADMIN_COLORS.medGray }}>— Top level —</span>,
  },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

export default function AdminCategories() {
  useEffect(() => { document.title = "Categories | TradeMarco Admin"; }, []);

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Product categories used across the catalog, imports and the public Products explorer."
        actions={
          <Button variant="primary" style={{ padding: "10px 20px", fontSize: 13 }}>
            <Icon type="plus" size={16} color={ADMIN_COLORS.white} /> Add Category
          </Button>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={MOCK_CATEGORIES}
        searchPlaceholder="Search categories…"
        searchKeys={["name", "description"]}
        actions={() => <RowActions onEdit={() => {}} onDelete={() => {}} />}
        emptyMessage="No categories found."
      />
    </div>
  );
}

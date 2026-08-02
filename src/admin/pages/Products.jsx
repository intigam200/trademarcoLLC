import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { ADMIN_COLORS } from "../theme";

const COLUMNS = [
  { key: "partNumber", label: "Part Number" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "category", label: "Category" },
  { key: "series", label: "Series" },
  { key: "productName", label: "Product Name", wrap: true },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "updatedAt", label: "Last Updated" },
];

export default function AdminProducts() {
  useEffect(() => { document.title = "Products | TradeMarco Admin"; }, []);
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Products"
        description="The live catalog is empty until a CSV is imported or products are added here. See the Import page to bring in a CSV in bulk."
        actions={
          <Button variant="primary" onClick={() => navigate("/admin/products/new")} style={{ padding: "10px 20px", fontSize: 13 }}>
            <Icon type="plus" size={16} color={ADMIN_COLORS.white} /> Add Product
          </Button>
        }
      />
      <DataTable
        columns={COLUMNS}
        rows={[]}
        searchPlaceholder="Search by part number, product name…"
        searchKeys={["partNumber", "productName", "manufacturer"]}
        filters={[
          { key: "status", label: "All Statuses", options: [
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "archived", label: "Archived" },
          ] },
        ]}
        actions={(row) => (
          <RowActions
            onView={() => navigate(`/admin/products/${row.id}/edit`)}
            onEdit={() => navigate(`/admin/products/${row.id}/edit`)}
            onDelete={() => {}}
          />
        )}
        emptyMessage="No products yet. Import a CSV from the Import page, or add your first product."
      />
    </div>
  );
}

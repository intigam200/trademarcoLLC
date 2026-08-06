import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DataTable from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import RowActions from "../components/RowActions";
import Button from "../../components/Button";
import Icon from "../../components/Icon";
import { ADMIN_COLORS } from "../theme";
import { listProductsPage, deleteProduct, countProducts, publishAllDrafts } from "../../lib/supabase/products";

const PAGE_SIZE = 25;

const COLUMNS = [
  { key: "part_number", label: "Part Number" },
  { key: "manufacturer_name", label: "Manufacturer" },
  { key: "category_name", label: "Category" },
  { key: "series", label: "Series" },
  { key: "product_name", label: "Product Name", wrap: true },
  { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
  { key: "updated_at", label: "Last Updated", render: (row) => new Date(row.updated_at).toLocaleDateString() },
];

export default function AdminProducts() {
  useEffect(() => { document.title = "Products | Trademarco Global Admin"; }, []);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(""); // updates instantly as the user types
  const [search, setSearch] = useState(""); // debounced value that actually drives the query
  const [statusFilter, setStatusFilter] = useState("");
  const [draftCount, setDraftCount] = useState(0);
  const [publishingAll, setPublishingAll] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    listProductsPage({ search, status: statusFilter || undefined, page, pageSize: PAGE_SIZE })
      .then(({ data, count }) => {
        setProducts(data.map((p) => ({
          ...p,
          manufacturer_name: p.manufacturer?.name ?? "—",
          category_name: p.category?.name ?? "—",
        })));
        setTotalCount(count);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  // Debounced search — refetch 350ms after the user stops typing instead of
  // firing a query per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const refreshDraftCount = useCallback(() => {
    countProducts({ status: "draft" }).then(setDraftCount).catch(() => {});
  }, []);

  useEffect(() => { refreshDraftCount(); }, [refreshDraftCount]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete "${row.product_name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct(row.id);
      load();
      refreshDraftCount();
    } catch (err) {
      window.alert(`Could not delete: ${err.message}`);
    }
  };

  const handlePublishAll = async () => {
    if (!draftCount) return;
    if (!window.confirm(`Publish all ${draftCount} draft product(s)? They will immediately appear on the public site.`)) return;
    setPublishingAll(true);
    try {
      await publishAllDrafts();
      load();
      refreshDraftCount();
    } catch (err) {
      window.alert(`Could not publish all products: ${err.message}`);
    } finally {
      setPublishingAll(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Live product catalog, backed by Supabase. Import a CSV to add products in bulk, or add one manually."
        actions={
          <>
            {draftCount > 0 && (
              <Button variant="outline" disabled={publishingAll} onClick={handlePublishAll} style={{ padding: "10px 20px", fontSize: 13, opacity: publishingAll ? 0.7 : 1 }}>
                <Icon type="check" size={16} color={ADMIN_COLORS.navy} />
                {publishingAll ? "Publishing…" : `Publish All (${draftCount})`}
              </Button>
            )}
            <Button variant="primary" onClick={() => navigate("/admin/products/new")} style={{ padding: "10px 20px", fontSize: 13 }}>
              <Icon type="plus" size={16} color={ADMIN_COLORS.white} /> Add Product
            </Button>
          </>
        }
      />

      {error && (
        <div style={{ fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6, marginBottom: 16 }}>
          Could not load products: {error}
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        rows={products}
        serverMode
        loading={loading}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        page={page}
        onPageChange={setPage}
        search={searchInput}
        onSearchChange={setSearchInput}
        activeFilters={{ status: statusFilter }}
        onFilterChange={(key, value) => { if (key === "status") { setStatusFilter(value); setPage(1); } }}
        searchPlaceholder="Search by part number, product name…"
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
            onDelete={() => handleDelete(row)}
          />
        )}
        emptyMessage="No products yet. Import a CSV from the Import page, or add your first product."
      />
    </div>
  );
}

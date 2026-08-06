import { useMemo, useState } from "react";
import { ADMIN_COLORS } from "../theme";
import Icon from "../../components/Icon";

// Generic table: search + column filters + sort + pagination, driven entirely
// by a `columns` definition and a `rows` array. Reused across every admin
// list page (Products, Manufacturers, Categories, RFQs) so list behavior
// stays consistent without duplicating table logic per page.
//
// By default everything (search/filter/sort/paging) runs client-side over
// the full `rows` array — fine for lists that stay small (manufacturers,
// categories, RFQs). Pass `serverMode` for lists that can grow large (e.g.
// products): the table then renders `rows` as-is (already the current page
// from the server) and defers search/filter/page changes to the caller via
// onSearchChange/onFilterChange/onPageChange instead of filtering locally.
export default function DataTable({
  columns,
  rows,
  searchPlaceholder = "Search…",
  searchKeys = [],
  filters = [],
  actions,
  emptyMessage = "No records found.",
  pageSize = 10,
  serverMode = false,
  totalCount = 0,
  loading = false,
  page: serverPage = 1,
  onPageChange,
  search: serverSearch = "",
  onSearchChange,
  activeFilters: serverFilters = {},
  onFilterChange,
}) {
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (serverMode) return rows;
    let result = rows;
    if (search.trim() && searchKeys.length) {
      const q = search.trim().toLowerCase();
      result = result.filter((row) => searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)));
    }
    for (const [key, value] of Object.entries(activeFilters)) {
      if (!value) continue;
      result = result.filter((row) => String(row[key]) === String(value));
    }
    if (sort.key) {
      result = [...result].sort((a, b) => {
        const av = a[sort.key];
        const bv = b[sort.key];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return sort.dir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, search, activeFilters, sort, searchKeys, serverMode]);

  const totalPages = serverMode
    ? Math.max(1, Math.ceil(totalCount / pageSize))
    : Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = serverMode ? serverPage : Math.min(page, totalPages);
  const pageRows = serverMode ? rows : filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resultCount = serverMode ? totalCount : filtered.length;

  const toggleSort = (key) => {
    if (serverMode) return; // rows already arrive sorted by the server query
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const handleSearchChange = (value) => {
    if (serverMode) { onSearchChange?.(value); return; }
    setSearch(value);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    if (serverMode) { onFilterChange?.(key, value); return; }
    setActiveFilters((v) => ({ ...v, [key]: value }));
    setPage(1);
  };

  const handlePageChange = (next) => {
    if (serverMode) { onPageChange?.(next); return; }
    setPage(next);
  };

  const selectStyle = {
    padding: "9px 12px", fontSize: 13, fontFamily: "inherit", border: `1px solid ${ADMIN_COLORS.border}`,
    borderRadius: 6, background: ADMIN_COLORS.white, color: ADMIN_COLORS.darkGray, outline: "none",
  };

  const pagerBtnStyle = (disabled) => ({
    width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
    border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, background: ADMIN_COLORS.white,
    cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1,
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 240px", minWidth: 200 }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
            <Icon type="search" size={15} color={ADMIN_COLORS.medGray} />
          </span>
          <input
            value={serverMode ? serverSearch : search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              width: "100%", padding: "10px 12px 10px 36px", fontSize: 13, fontFamily: "inherit",
              border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 6, outline: "none",
              background: ADMIN_COLORS.white, color: ADMIN_COLORS.darkGray,
            }}
          />
        </div>
        {filters.map((f) => (
          <select
            key={f.key}
            value={(serverMode ? serverFilters[f.key] : activeFilters[f.key]) || ""}
            onChange={(e) => handleFilterChange(f.key, e.target.value)}
            style={selectStyle}
          >
            <option value="">{f.label}</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ))}
      </div>

      <div style={{ overflowX: "auto", border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 10, background: ADMIN_COLORS.cardBg }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && toggleSort(col.key)}
                  style={{
                    textAlign: "left", padding: "12px 16px", borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                    color: ADMIN_COLORS.medGray, fontWeight: 600, fontSize: 11, textTransform: "uppercase",
                    letterSpacing: "0.04em", cursor: !serverMode && col.sortable !== false ? "pointer" : "default", whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {col.label}
                    {!serverMode && col.sortable !== false && sort.key === col.key && (
                      <Icon type={sort.dir === "asc" ? "chevron-up" : "chevron-down"} size={12} color={ADMIN_COLORS.medGray} />
                    )}
                  </span>
                </th>
              ))}
              {actions && <th style={{ padding: "12px 16px", borderBottom: `1px solid ${ADMIN_COLORS.border}` }} />}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: "48px 16px", textAlign: "center", color: ADMIN_COLORS.medGray }}>
                  Loading&hellip;
                </td>
              </tr>
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} style={{ padding: "48px 16px", textAlign: "center", color: ADMIN_COLORS.medGray }}>
                  {emptyMessage}
                </td>
              </tr>
            ) : pageRows.map((row) => (
              <tr key={row.id} className="tm-dt-row" style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                {columns.map((col) => (
                  <td key={col.key} style={{ padding: "13px 16px", color: ADMIN_COLORS.darkGray, whiteSpace: col.wrap ? "normal" : "nowrap" }}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {actions && <td style={{ padding: "8px 16px", textAlign: "right", whiteSpace: "nowrap" }}>{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, fontSize: 13, color: ADMIN_COLORS.medGray, flexWrap: "wrap", gap: 12 }}>
        <span>
          {resultCount === 0
            ? "0 results"
            : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, resultCount)} of ${resultCount}`}
        </span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} style={pagerBtnStyle(currentPage <= 1)}>
            <Icon type="chevron-left" size={14} color={ADMIN_COLORS.navy} />
          </button>
          <span style={{ minWidth: 60, textAlign: "center" }}>{currentPage} / {totalPages}</span>
          <button disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} style={pagerBtnStyle(currentPage >= totalPages)}>
            <Icon type="chevron-right" size={14} color={ADMIN_COLORS.navy} />
          </button>
        </div>
      </div>

      <style>{`
        .tm-dt-row:hover { background: ${ADMIN_COLORS.contentBg}; }
        .tm-dt-row:last-child { border-bottom: none; }
      `}</style>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ADMIN_COLORS } from "../../theme";
import { auditProducts, PRODUCT_CHECKS, SEVERITY_ORDER } from "../../../lib/seoAudit/catalogAudit";
import { SeverityBadge, Pager, table, inputStyle, Notice, Empty, MigrationNotice } from "./ui";
import ProductSeoEditor from "./ProductSeoEditor";

const PAGE_SIZE = 25;

function SourceTag({ source }) {
  const label = { custom: "custom", content: "from product text", template: "template", missing: "missing" }[source];
  const color = source === "custom" ? ADMIN_COLORS.success : source === "template" || source === "missing" ? ADMIN_COLORS.warning : ADMIN_COLORS.medGray;
  return <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>;
}

export default function ProductSeoTab({ data, reload }) {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const filters = {
    q: params.get("q") || "",
    manufacturer: params.get("manufacturer") || "",
    category: params.get("category") || "",
    issue: params.get("issue") || "",
    severity: params.get("severity") || "",
    status: params.get("status") || "published",
  };
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
    setPage(1);
  };

  const audit = useMemo(() => auditProducts(data.products, { relatedCounts: data.relatedCounts, altSupported: data.migration.imageAlt }), [data]);

  const rows = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return audit.rows
      .filter((r) => !filters.status || r.product.status === filters.status)
      .filter((r) => !filters.manufacturer || r.product.manufacturer_id === filters.manufacturer)
      .filter((r) => !filters.category || r.product.category_id === filters.category)
      .filter((r) => !filters.issue || (filters.issue === "none" ? r.issues.length === 0 : r.issues.includes(filters.issue)))
      .filter((r) => !filters.severity || r.worst === filters.severity)
      .filter((r) => !q || `${r.product.part_number} ${r.product.product_name} ${r.product.manufacturer?.name ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => (SEVERITY_ORDER[a.worst] ?? 9) - (SEVERITY_ORDER[b.worst] ?? 9) || b.issues.length - a.issues.length);
  }, [audit, filters.q, filters.manufacturer, filters.category, filters.issue, filters.severity, filters.status]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const editingRow = editing ? audit.rows.find((r) => r.product.id === editing) : null;

  const select = (key, options, label) => (
    <select aria-label={label} style={{ ...inputStyle, width: "auto", minWidth: 150 }} value={filters[key]} onChange={(e) => setFilter(key, e.target.value)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );

  return (
    <div>
      {!data.migration.imageAlt && <div style={{ marginBottom: 14 }}><MigrationNotice what="Editing image alt text" /></div>}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input type="search" aria-label="Search products" placeholder="Search part number, name or brand…" style={{ ...inputStyle, width: 260 }} value={filters.q} onChange={(e) => setFilter("q", e.target.value)} />
        {select("status", [["published", "Published"], ["draft", "Draft"], ["archived", "Archived"], ["", "All statuses"]], "Status")}
        {select("manufacturer", [["", "All manufacturers"], ...data.manufacturers.map((m) => [m.id, m.name])], "Manufacturer")}
        {select("category", [["", "All categories"], ...data.categories.map((c) => [c.id, c.name])], "Category")}
        {select("issue", [["", "Any issue state"], ["none", "No issues"], ...Object.entries(PRODUCT_CHECKS).map(([id, d]) => [id, `${d.label} (${audit.counts[id]})`])], "Issue")}
        {select("severity", [["", "Any severity"], ["high", "High"], ["medium", "Medium"], ["low", "Low"]], "Severity")}
      </div>

      {filters.issue && PRODUCT_CHECKS[filters.issue] && (
        <div style={{ marginBottom: 12 }}>
          <Notice title={PRODUCT_CHECKS[filters.issue].label}>
            <div><strong>Impact:</strong> {PRODUCT_CHECKS[filters.issue].impact}</div>
            <div><strong>Recommended fix:</strong> {PRODUCT_CHECKS[filters.issue].fix}</div>
          </Notice>
        </div>
      )}

      {rows.length === 0 ? (
        <Empty>No products match these filters.</Empty>
      ) : (
        <>
          <div style={table.wrap}>
            <table style={table.table}>
              <thead>
                <tr>
                  {["Product", "Category", "SEO title", "Meta description", "Description", "Image / alt", "Links", "Indexability", "Audit", "Updated"].map((h) => <th key={h} scope="col" style={table.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const p = r.product;
                  const thin = r.issues.includes("content_thin");
                  return (
                    <tr key={p.id}>
                      <td style={{ ...table.td, minWidth: 200 }}>
                        <button type="button" onClick={() => setEditing(p.id)} style={{ all: "unset", cursor: "pointer", color: ADMIN_COLORS.accent, fontWeight: 600 }}>
                          {p.product_name}
                        </button>
                        <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>{p.manufacturer?.name} · {p.part_number}</div>
                      </td>
                      <td style={table.td}>{p.category?.name ?? "—"}</td>
                      <td style={{ ...table.td, minWidth: 220 }}>
                        <div style={{ color: r.titleDuplicates > 1 ? ADMIN_COLORS.danger : undefined }}>{r.meta.title}</div>
                        <SourceTag source={r.meta.titleSource} /> <span style={{ fontSize: 11, color: ADMIN_COLORS.medGray }}>· {r.meta.title.length} chars{r.titleDuplicates > 1 ? ` · used ${r.titleDuplicates}×` : ""}</span>
                      </td>
                      <td style={{ ...table.td, minWidth: 240 }}>
                        <div style={{ color: r.descriptionDuplicates > 1 ? ADMIN_COLORS.danger : undefined }}>{r.meta.description.length > 110 ? `${r.meta.description.slice(0, 110)}…` : r.meta.description}</div>
                        <SourceTag source={r.meta.descriptionSource} /> <span style={{ fontSize: 11, color: ADMIN_COLORS.medGray }}>· {r.meta.description.length} chars{r.descriptionDuplicates > 1 ? ` · used ${r.descriptionDuplicates}×` : ""}</span>
                      </td>
                      <td style={table.td}>{thin ? <span style={{ color: ADMIN_COLORS.warning }}>Incomplete</span> : p.long_description ? "Complete" : "Short only"}</td>
                      <td style={table.td}>{!p.image_url ? <span style={{ color: ADMIN_COLORS.warning }}>No image</span> : !data.migration.imageAlt ? "Image · alt: name" : r.meta.imageAltSource === "custom" ? "Image · custom alt" : "Image · default alt"}</td>
                      <td style={table.td}>{data.relatedCounts.get(p.id) ? `${data.relatedCounts.get(p.id)} related` : <span style={{ color: ADMIN_COLORS.medGray }}>prev/next only</span>}</td>
                      <td style={table.td}>{p.status === "published" ? "In sitemap" : <span style={{ color: ADMIN_COLORS.medGray }}>Not public</span>}</td>
                      <td style={table.td}><SeverityBadge severity={r.worst} />{r.issues.length > 0 && <div style={{ fontSize: 11, color: ADMIN_COLORS.medGray, marginTop: 4 }}>{r.issues.length} issue{r.issues.length === 1 ? "" : "s"}</div>}</td>
                      <td style={{ ...table.td, whiteSpace: "nowrap", fontSize: 12, color: ADMIN_COLORS.medGray }}>{new Date(p.updated_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pager page={current} pageCount={pageCount} onPage={setPage} total={rows.length} label="products" />
          <p style={{ fontSize: 12, color: ADMIN_COLORS.medGray, margin: "4px 0 0" }}>
            Indexability shows whether the page is public and listed in sitemap.xml. Whether Google has actually indexed it needs Search Console.
          </p>
        </>
      )}

      {editingRow && (
        <ProductSeoEditor
          row={editingRow}
          data={data}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload(); }}
        />
      )}
    </div>
  );
}

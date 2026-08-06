import { useEffect, useMemo, useRef, useState } from "react";
import { listManufacturers } from "../../lib/supabase/manufacturers";
import { listCategories } from "../../lib/supabase/categories";
import { bulkUpsertProducts, bulkSetStatus, findProductsBySlugs } from "../../lib/supabase/products";
import { uploadDatasheet } from "../../lib/supabase/storage";
import { slugify } from "../../data/catalog/schema";
import {
  MAPPABLE_FIELDS, guessFieldForHeader, parseCSVFile, parseExcelFile, parsePdfFile,
  applyColumnMapping, buildDraftRow, revalidateDraftRows, annotateExistingMatches, draftRowToProductPayload, failedRowsToCSV,
} from "../../lib/importCenter";
import { ADMIN_COLORS } from "../theme";
import PageHeader from "../components/PageHeader";
import AdminCard from "../components/AdminCard";
import Icon from "../../components/Icon";
import Button from "../../components/Button";

const CHUNK_SIZE = 500;

const cellInputStyle = {
  width: "100%", minWidth: 130, padding: "6px 8px", fontSize: 12, fontFamily: "inherit",
  border: `1px solid ${ADMIN_COLORS.border}`, borderRadius: 4, outline: "none",
  color: ADMIN_COLORS.darkGray, background: ADMIN_COLORS.white,
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function detectFileKind(file) {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "excel";
  if (ext === "pdf") return "pdf";
  return null;
}

function fieldLabel(key) {
  return MAPPABLE_FIELDS.find((f) => f.key === key)?.label ?? key;
}

// Cross-checks a batch of validated draft rows against the catalog (scoped
// to just their part numbers) so the preview can flag rows that will update
// an existing product instead of creating a new one. Non-fatal by design —
// this is informational, not a blocker, so a failed lookup just skips it.
async function withExistingMatches(rows) {
  const slugs = [...new Set(rows.map((r) => r.raw.partNumber).filter(Boolean).map(slugify))];
  try {
    const existing = await findProductsBySlugs(slugs);
    return annotateExistingMatches(rows, existing);
  } catch {
    return rows;
  }
}

function Steps({ current, showMap }) {
  const steps = [
    { key: "upload", label: "Upload" },
    ...(showMap ? [{ key: "map", label: "Map Columns" }] : []),
    { key: "review", label: "Review" },
    { key: "done", label: "Import" },
  ];
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
      {steps.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: i <= currentIndex ? ADMIN_COLORS.navy : ADMIN_COLORS.medGray }}>
            <span style={{
              width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              background: i <= currentIndex ? ADMIN_COLORS.accent : ADMIN_COLORS.neutralBg,
              color: i <= currentIndex ? ADMIN_COLORS.white : ADMIN_COLORS.medGray, fontSize: 12, flexShrink: 0,
            }}>
              {i + 1}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && <div style={{ width: 32, height: 1, background: ADMIN_COLORS.border }} />}
        </div>
      ))}
    </div>
  );
}

function StatTile({ count, label, color, bg }) {
  return (
    <div style={{ flex: "1 1 120px", background: bg, borderRadius: 8, padding: "16px 18px" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.medGray, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function AdminImport() {
  useEffect(() => { document.title = "Import Center | TradeMarco Admin"; }, []);

  const [step, setStep] = useState("upload"); // upload | map | review | done
  const [fileName, setFileName] = useState("");
  const [fileKind, setFileKind] = useState(null); // csv | excel | pdf
  const [parsing, setParsing] = useState(false);
  const [checkingMatches, setCheckingMatches] = useState(false);
  const [parseError, setParseError] = useState("");
  const [manufacturers, setManufacturers] = useState([]);
  const [categories, setCategories] = useState([]);

  // Map Columns step state (csv/excel only)
  const [columns, setColumns] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({}); // { header: fieldKey | "" }

  const [rows, setRows] = useState([]);
  const [publishOnImport, setPublishOnImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [report, setReport] = useState(null);
  const [publishingAll, setPublishingAll] = useState(false);
  const [publishedAll, setPublishedAll] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const kind = detectFileKind(file);
    setFileName(file.name);
    setFileKind(kind);
    setParseError("");

    if (!kind) {
      setParseError("Unsupported file type. Upload a .csv, .xlsx, .xls or .pdf file.");
      return;
    }

    setParsing(true);
    try {
      const [mfrs, cats] = await Promise.all([listManufacturers(), listCategories()]);
      setManufacturers(mfrs);
      setCategories(cats);

      if (kind === "pdf") {
        const entries = await parsePdfFile(file, { manufacturers: mfrs });
        const draftRows = entries.map(({ row, pdfFile }) =>
          buildDraftRow(row, { manufacturers: mfrs, categories: cats }, { pdfFile })
        );
        setRows(await withExistingMatches(revalidateDraftRows(draftRows)));
        setStep("review");
        return;
      }

      const { headers, rows: rawRows } = kind === "csv" ? await parseCSVFile(file) : await parseExcelFile(file);
      if (!headers.length || !rawRows.length) {
        setParseError("No columns or rows could be read from this file.");
        return;
      }

      // Auto-guess each column's target field, but never let two columns
      // guess the same field — an ambiguous second match is left for the
      // admin to resolve explicitly rather than risking a silent wrong pick.
      const usedFields = new Set();
      const initialMapping = {};
      for (const header of headers) {
        const guess = guessFieldForHeader(header);
        if (guess && !usedFields.has(guess)) {
          initialMapping[header] = guess;
          usedFields.add(guess);
        } else {
          initialMapping[header] = "";
        }
      }

      setColumns(headers);
      setParsedRows(rawRows);
      setColumnMapping(initialMapping);
      setStep("map");
    } catch (err) {
      setParseError(err.message || "Could not read this file.");
    } finally {
      setParsing(false);
    }
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setFileKind(null);
    setParseError("");
    setColumns([]);
    setParsedRows([]);
    setColumnMapping({});
    setRows([]);
    setReport(null);
    setPublishingAll(false);
    setPublishedAll(false);
    setImportProgress({ done: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const mappingIssues = useMemo(() => {
    const counts = {};
    for (const field of Object.values(columnMapping)) {
      if (!field) continue;
      counts[field] = (counts[field] ?? 0) + 1;
    }
    return Object.entries(counts).filter(([, n]) => n > 1).map(([field]) => field);
  }, [columnMapping]);

  const requiredFieldsMapped = useMemo(() => {
    const mapped = new Set(Object.values(columnMapping).filter(Boolean));
    return ["productName", "partNumber", "manufacturer", "category"].every((f) => mapped.has(f));
  }, [columnMapping]);

  const handleContinueToReview = async () => {
    const draftRows = parsedRows.map((rawRow) =>
      buildDraftRow(applyColumnMapping(rawRow, columnMapping), { manufacturers, categories })
    );
    setCheckingMatches(true);
    setRows(await withExistingMatches(revalidateDraftRows(draftRows)));
    setCheckingMatches(false);
    setStep("review");
  };

  const setRowField = (key, field, value) => {
    setRows((prev) => revalidateDraftRows(prev.map((r) => {
      if (r.key !== key) return r;
      if (field === "manufacturerId" || field === "categoryId") return { ...r, [field]: value };
      return { ...r, raw: { ...r.raw, [field]: value } };
    })));
  };

  const handleConfirmImport = async () => {
    const validRows = rows.filter((r) => r.status === "valid");
    const skipped = rows.length - validRows.length;
    setImporting(true);
    setImportProgress({ done: 0, total: validRows.length });

    let imported = 0;
    let updated = 0;
    const failed = [];
    const writtenIds = [];

    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      const chunk = validRows.slice(i, i + CHUNK_SIZE);
      try {
        const payloads = [];
        for (const row of chunk) {
          let datasheetUrlOverride;
          if (row.pdfFile) datasheetUrlOverride = await uploadDatasheet(row.pdfFile);
          payloads.push(draftRowToProductPayload(row, {
            status: publishOnImport ? "published" : "draft",
            datasheetUrlOverride,
          }));
        }
        const result = await bulkUpsertProducts(payloads);
        imported += result.imported;
        updated += result.updated;
        writtenIds.push(...result.written.map((w) => w.id));
      } catch (err) {
        for (const row of chunk) failed.push({ row, error: err.message });
      }
      setImportProgress({ done: Math.min(i + CHUNK_SIZE, validRows.length), total: validRows.length });
    }

    setReport({ imported, updated, skipped, failed, writtenIds });
    setPublishedAll(publishOnImport);
    setImporting(false);
    setStep("done");
  };

  const handlePublishAll = async () => {
    if (!report?.writtenIds?.length) return;
    setPublishingAll(true);
    try {
      await bulkSetStatus(report.writtenIds, "published");
      setPublishedAll(true);
    } catch (err) {
      window.alert(`Could not publish all products: ${err.message}`);
    } finally {
      setPublishingAll(false);
    }
  };

  const handleDownloadFailed = () => {
    if (!report?.failed?.length) return;
    downloadBlob(failedRowsToCSV(report.failed), `import-failed-${Date.now()}.csv`);
  };

  const validCount = rows.filter((r) => r.status === "valid").length;
  const errorCount = rows.length - validCount;
  const existingMatchCount = rows.filter((r) => r.status === "valid" && r.existingMatch).length;
  const showMapStep = fileKind === "csv" || fileKind === "excel";

  return (
    <div>
      <PageHeader
        title="Import Center"
        description="Bring products in from a CSV, Excel or PDF datasheet. Your file is always the source of truth — nothing is renamed, replaced or invented; you confirm the column mapping before anything touches Supabase."
      />

      <Steps current={step} showMap={showMapStep} />

      {step === "upload" && (
        <AdminCard>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => !parsing && fileInputRef.current?.click()}
            style={{ border: `2px dashed ${ADMIN_COLORS.border}`, borderRadius: 10, padding: "56px 24px", textAlign: "center", cursor: parsing ? "default" : "pointer" }}
          >
            <Icon type="upload" size={32} color={ADMIN_COLORS.medGray} />
            <p style={{ fontSize: 15, fontWeight: 600, color: ADMIN_COLORS.navy, margin: "16px 0 4px" }}>
              {parsing ? "Reading file…" : "Click to upload or drag a file here"}
            </p>
            <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: 0 }}>
              Supports .csv, .xlsx, .xls and .pdf (single-product datasheets). For spreadsheets, you&rsquo;ll confirm how
              each column maps to a product field on the next step — nothing is guessed silently.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf"
              style={{ display: "none" }}
              disabled={parsing}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
          {parseError && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6 }}>
              <Icon type="alert-triangle" size={15} color={ADMIN_COLORS.danger} />
              {parseError}
            </div>
          )}
        </AdminCard>
      )}

      {step === "map" && (
        <>
          <AdminCard title={`Map Columns — ${fileName}`} style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: "0 0 18px", lineHeight: 1.6 }}>
              Each spreadsheet column below is matched to a product field. Auto-detected matches are pre-selected —
              check every one. Columns set to <strong>Do not import</strong> are left out entirely; nothing is guessed
              or invented for them.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {columns.map((header) => {
                const guessed = guessFieldForHeader(header);
                const current = columnMapping[header] ?? "";
                const isDuplicate = current && mappingIssues.includes(current);
                return (
                  <div key={header} style={{
                    display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 14,
                    padding: "10px 14px", borderRadius: 8, background: isDuplicate ? ADMIN_COLORS.dangerBg : ADMIN_COLORS.contentBg,
                  }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: ADMIN_COLORS.navy }}>&ldquo;{header}&rdquo;</div>
                      <div style={{ fontSize: 11, color: ADMIN_COLORS.medGray, marginTop: 2 }}>
                        {guessed ? "Auto-detected" : "No automatic match — choose manually"}
                      </div>
                    </div>
                    <Icon type="arrow-right" size={14} color={ADMIN_COLORS.medGray} />
                    <select
                      style={cellInputStyle}
                      value={current}
                      onChange={(e) => setColumnMapping((m) => ({ ...m, [header]: e.target.value }))}
                    >
                      <option value="">Do not import</option>
                      {MAPPABLE_FIELDS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
                    </select>
                  </div>
                );
              })}
            </div>

            {mappingIssues.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6 }}>
                <Icon type="alert-triangle" size={15} color={ADMIN_COLORS.danger} />
                More than one column is mapped to: {mappingIssues.map(fieldLabel).join(", ")}. Each field can only come from one column.
              </div>
            )}
            {mappingIssues.length === 0 && !requiredFieldsMapped && (
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.warning, background: ADMIN_COLORS.warningBg, padding: "10px 14px", borderRadius: 6 }}>
                <Icon type="info" size={15} color={ADMIN_COLORS.warning} />
                Product Name, Part Number, Manufacturer and Category must all be mapped to a column before continuing.
              </div>
            )}
          </AdminCard>

          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <Button variant="outline" onClick={reset} style={{ padding: "12px 22px", fontSize: 13 }}>
              Start Over
            </Button>
            <Button
              variant="primary"
              disabled={mappingIssues.length > 0 || !requiredFieldsMapped || checkingMatches}
              onClick={handleContinueToReview}
              style={{ padding: "12px 22px", fontSize: 13, opacity: mappingIssues.length > 0 || !requiredFieldsMapped || checkingMatches ? 0.6 : 1 }}
            >
              {checkingMatches ? "Checking for duplicates…" : `Continue to Review (${parsedRows.length} row${parsedRows.length === 1 ? "" : "s"})`}
            </Button>
          </div>
        </>
      )}

      {step === "review" && (
        <>
          <AdminCard title={`Review — ${fileName}`} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: showMapStep ? 16 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <Icon type="check" size={16} color={ADMIN_COLORS.success} />
                <span><strong style={{ color: ADMIN_COLORS.success }}>{validCount}</strong> ready to import</span>
              </div>
              {errorCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Icon type="alert-triangle" size={16} color={ADMIN_COLORS.danger} />
                  <span><strong style={{ color: ADMIN_COLORS.danger }}>{errorCount}</strong> need fixing (edit directly in the table below)</span>
                </div>
              )}
              {existingMatchCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                  <Icon type="info" size={16} color={ADMIN_COLORS.iconBlue} />
                  <span><strong style={{ color: ADMIN_COLORS.iconBlue }}>{existingMatchCount}</strong> already exist — will update instead of creating new</span>
                </div>
              )}
            </div>
            {showMapStep && (
              <div style={{ borderTop: `1px solid ${ADMIN_COLORS.border}`, paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div style={{ fontSize: 12, color: ADMIN_COLORS.medGray }}>
                  Column mapping: {Object.entries(columnMapping).filter(([, f]) => f).map(([h, f]) => `"${h}" → ${fieldLabel(f)}`).join("  •  ")}
                </div>
                <Button variant="outline" onClick={() => setStep("map")} style={{ padding: "8px 16px", fontSize: 12 }}>
                  Edit Mapping
                </Button>
              </div>
            )}
          </AdminCard>

          <AdminCard title="Preview" style={{ marginBottom: 20 }}>
            <div style={{ overflowX: "auto", maxHeight: 520, overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    {["Status", "Manufacturer", "Part Number", "Product Name", "Category", "Description", "SEO Title", "SEO Description"].map((h) => (
                      <th key={h} style={{
                        textAlign: "left", padding: "10px", borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                        color: ADMIN_COLORS.medGray, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
                        position: "sticky", top: 0, background: ADMIN_COLORS.cardBg, whiteSpace: "nowrap",
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} style={{
                      background: row.status === "error" ? ADMIN_COLORS.dangerBg : row.existingMatch ? ADMIN_COLORS.iconBlueBg : "transparent",
                      borderBottom: `1px solid ${ADMIN_COLORS.border}`,
                    }}>
                      <td style={{ padding: "8px 10px", verticalAlign: "top", minWidth: 150 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Icon type={row.status === "valid" ? "check" : "alert-triangle"} size={14} color={row.status === "valid" ? ADMIN_COLORS.success : ADMIN_COLORS.danger} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: row.status === "valid" ? ADMIN_COLORS.success : ADMIN_COLORS.danger }}>
                            {row.status === "valid" ? "Valid" : "Error"}
                          </span>
                        </div>
                        {row.errors.length > 0 && (
                          <div style={{ fontSize: 10.5, color: ADMIN_COLORS.danger, marginTop: 4, lineHeight: 1.4 }}>
                            {row.errors.join("; ")}
                          </div>
                        )}
                        {row.status === "valid" && row.existingMatch && (
                          <div style={{ fontSize: 10.5, color: ADMIN_COLORS.iconBlue, marginTop: 4, lineHeight: 1.4 }}>
                            {row.existingMatch.sameManufacturer
                              ? "Already exists — will update it"
                              : `Part number already exists under ${row.existingMatch.manufacturerName}`}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <select style={cellInputStyle} value={row.manufacturerId} onChange={(e) => setRowField(row.key, "manufacturerId", e.target.value)}>
                          <option value="">{row.raw.manufacturerText ? `"${row.raw.manufacturerText}" (unmatched)` : "— Select —"}</option>
                          {manufacturers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <input style={cellInputStyle} value={row.raw.partNumber} onChange={(e) => setRowField(row.key, "partNumber", e.target.value)} />
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <input style={cellInputStyle} value={row.raw.productName} onChange={(e) => setRowField(row.key, "productName", e.target.value)} />
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <select style={cellInputStyle} value={row.categoryId} onChange={(e) => setRowField(row.key, "categoryId", e.target.value)}>
                          <option value="">{row.raw.categoryText ? `"${row.raw.categoryText}" (unmatched)` : "— Select —"}</option>
                          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <input style={{ ...cellInputStyle, minWidth: 200 }} value={row.raw.shortDescription} onChange={(e) => setRowField(row.key, "shortDescription", e.target.value)} placeholder={row.raw.productName ? `Defaults to "${row.raw.productName}"` : ""} />
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <input style={cellInputStyle} value={row.raw.seoTitle} onChange={(e) => setRowField(row.key, "seoTitle", e.target.value)} placeholder="Left blank if not provided" />
                      </td>
                      <td style={{ padding: "8px 10px", verticalAlign: "top" }}>
                        <input style={{ ...cellInputStyle, minWidth: 200 }} value={row.raw.seoDescription} onChange={(e) => setRowField(row.key, "seoDescription", e.target.value)} placeholder="Left blank if not provided" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminCard>

          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant="outline" onClick={reset} disabled={importing} style={{ padding: "12px 22px", fontSize: 13 }}>
              Start Over
            </Button>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.darkGray, cursor: "pointer" }}>
              <input type="checkbox" checked={publishOnImport} onChange={(e) => setPublishOnImport(e.target.checked)} />
              Publish immediately (otherwise imported as drafts)
            </label>
            <Button
              variant="primary"
              disabled={validCount === 0 || importing}
              onClick={handleConfirmImport}
              style={{ padding: "12px 22px", fontSize: 13, opacity: validCount === 0 || importing ? 0.6 : 1 }}
            >
              {importing ? `Importing ${importProgress.done}/${importProgress.total}…` : `Import Valid Rows (${validCount})`}
            </Button>
          </div>
        </>
      )}

      {step === "done" && report && (
        <AdminCard>
          <div style={{ padding: "8px 0 24px" }}>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <StatTile count={report.imported} label="Imported" color={ADMIN_COLORS.success} bg={ADMIN_COLORS.successBg} />
              <StatTile count={report.updated} label="Updated" color={ADMIN_COLORS.iconBlue} bg={ADMIN_COLORS.iconBlueBg} />
              <StatTile count={report.skipped} label="Skipped" color={ADMIN_COLORS.warning} bg={ADMIN_COLORS.warningBg} />
              <StatTile count={report.failed.length} label="Failed" color={ADMIN_COLORS.danger} bg={ADMIN_COLORS.dangerBg} />
            </div>

            <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, lineHeight: 1.6, margin: "0 0 20px" }}>
              {report.imported + report.updated > 0 && (
                publishedAll
                  ? "New and updated products are published — live on the public site now."
                  : "New and updated products were saved as drafts. Review them on the Products page, or publish them all now."
              )}
              {report.skipped > 0 && ` ${report.skipped} row(s) were left out of the import because they still had validation errors.`}
              {report.failed.length > 0 && ` ${report.failed.length} row(s) passed validation but failed to save — download them below to see why.`}
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {!publishedAll && report.writtenIds.length > 0 && (
                <Button variant="primary" disabled={publishingAll} onClick={handlePublishAll} style={{ padding: "12px 22px", fontSize: 13, opacity: publishingAll ? 0.7 : 1 }}>
                  <Icon type="check" size={15} color={ADMIN_COLORS.white} />
                  {publishingAll ? "Publishing…" : `Publish All (${report.writtenIds.length})`}
                </Button>
              )}
              {report.failed.length > 0 && (
                <Button variant="outline" onClick={handleDownloadFailed} style={{ padding: "12px 22px", fontSize: 13 }}>
                  <Icon type="download" size={15} color={ADMIN_COLORS.navy} /> Download Failed Rows (CSV)
                </Button>
              )}
              <Button variant="outline" onClick={reset} style={{ padding: "12px 22px", fontSize: 13 }}>
                Import Another File
              </Button>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { MANUFACTURERS, PRODUCTS as CATEGORIES, INDUSTRIES } from "../../data/content";
import { parseCSV, validateRows } from "../../data/catalog/schema";
import { ADMIN_COLORS } from "../theme";
import PageHeader from "../components/PageHeader";
import AdminCard from "../components/AdminCard";
import Icon from "../../components/Icon";
import Button from "../../components/Button";

const ISSUE_LABELS = {
  missingFields: "rows missing required fields",
  unknownManufacturer: "unknown manufacturers",
  unknownCategory: "unknown categories",
  unknownIndustry: "unknown industries",
  duplicate: "duplicate part numbers",
};

function ResultLine({ ok, count, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
      <Icon type={ok ? "check" : "alert-triangle"} size={16} color={ok ? ADMIN_COLORS.success : ADMIN_COLORS.warning} />
      <span style={{ color: ADMIN_COLORS.darkGray }}>
        <strong style={{ color: ok ? ADMIN_COLORS.success : ADMIN_COLORS.warning }}>{count}</strong> {label}
      </span>
    </div>
  );
}

function Steps({ current }) {
  const steps = [
    { key: "upload", label: "Upload" },
    { key: "review", label: "Validate & Preview" },
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

export default function AdminImport() {
  useEffect(() => { document.title = "Import | TradeMarco Admin"; }, []);

  const [step, setStep] = useState("upload"); // upload | review | done
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [parseError, setParseError] = useState("");
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCSV(String(reader.result));
        if (!rows.length) {
          setParseError("No data rows found in this CSV.");
          return;
        }
        const validated = validateRows(rows, {
          manufacturerSlugs: new Set(MANUFACTURERS.map((m) => m.slug)),
          categorySlugs: new Set(CATEGORIES.map((c) => c.slug)),
          industryNames: new Set(INDUSTRIES.map((i) => i.name.toLowerCase())),
        });
        setResult({ ...validated, totalRows: rows.length });
        setStep("review");
      } catch {
        setParseError("Could not parse this file. Make sure it's a valid CSV.");
      }
    };
    reader.readAsText(file);
  };

  const reset = () => {
    setStep("upload");
    setFileName("");
    setResult(null);
    setParseError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const totalIssues = result ? Object.values(result.issues).reduce((n, list) => n + list.length, 0) : 0;

  return (
    <div>
      <PageHeader title="Import" description="Bring products in from a CSV file. Nothing is added to the catalog until you review and confirm." />

      <Steps current={step} />

      {step === "upload" && (
        <AdminCard>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
            onClick={() => fileInputRef.current?.click()}
            style={{ border: `2px dashed ${ADMIN_COLORS.border}`, borderRadius: 10, padding: "56px 24px", textAlign: "center", cursor: "pointer" }}
          >
            <Icon type="upload" size={32} color={ADMIN_COLORS.medGray} />
            <p style={{ fontSize: 15, fontWeight: 600, color: ADMIN_COLORS.navy, margin: "16px 0 4px" }}>Click to upload or drag a CSV file here</p>
            <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, margin: 0 }}>
              Columns must match the catalog schema — see data/catalog/products.example.csv for the format.
            </p>
            <input ref={fileInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
          {parseError && (
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: ADMIN_COLORS.danger, background: ADMIN_COLORS.dangerBg, padding: "10px 14px", borderRadius: 6 }}>
              <Icon type="alert-triangle" size={15} color={ADMIN_COLORS.danger} />
              {parseError}
            </div>
          )}
        </AdminCard>
      )}

      {step === "review" && result && (
        <>
          <AdminCard title={`Validation Results — ${fileName}`} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <ResultLine ok count={result.validProducts.length} label="valid products" />
              {Object.entries(result.issues).map(([key, list]) => list.length > 0 && (
                <ResultLine key={key} count={list.length} label={ISSUE_LABELS[key]} />
              ))}
            </div>

            {totalIssues > 0 && (
              <div style={{ marginTop: 18, borderTop: `1px solid ${ADMIN_COLORS.border}`, paddingTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: ADMIN_COLORS.medGray, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Row Details
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.values(result.issues).flat().sort((a, b) => a.rowNumber - b.rowNumber).map((issue, i) => (
                    <div key={i} style={{ fontSize: 12, color: ADMIN_COLORS.darkGray }}>
                      Row {issue.rowNumber}: {issue.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AdminCard>

          {result.validProducts.length > 0 && (
            <AdminCard title="Preview" style={{ marginBottom: 20 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Part Number", "Manufacturer", "Category", "Product Name"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${ADMIN_COLORS.border}`, color: ADMIN_COLORS.medGray, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.validProducts.slice(0, 25).map((p) => (
                      <tr key={p.id} style={{ borderBottom: `1px solid ${ADMIN_COLORS.border}` }}>
                        <td style={{ padding: "10px 12px" }}>{p.partNumber}</td>
                        <td style={{ padding: "10px 12px" }}>{p.manufacturer}</td>
                        <td style={{ padding: "10px 12px" }}>{p.category}</td>
                        <td style={{ padding: "10px 12px" }}>{p.productName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.validProducts.length > 25 && (
                  <p style={{ fontSize: 12, color: ADMIN_COLORS.medGray, margin: "10px 12px 0" }}>
                    +{result.validProducts.length - 25} more not shown in preview
                  </p>
                )}
              </div>
            </AdminCard>
          )}

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button variant="outline" onClick={reset} style={{ padding: "12px 22px", fontSize: 13 }}>
              Start Over
            </Button>
            <Button
              variant="primary"
              disabled={result.validProducts.length === 0}
              onClick={() => setStep("done")}
              style={{ padding: "12px 22px", fontSize: 13, opacity: result.validProducts.length === 0 ? 0.5 : 1 }}
            >
              Confirm Import ({result.validProducts.length})
            </Button>
          </div>
        </>
      )}

      {step === "done" && result && (
        <AdminCard>
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: ADMIN_COLORS.successBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Icon type="check" size={24} color={ADMIN_COLORS.success} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: ADMIN_COLORS.navy, margin: "0 0 8px" }}>
              {result.validProducts.length} product(s) validated and ready
            </h3>
            <p style={{ fontSize: 13, color: ADMIN_COLORS.medGray, maxWidth: 440, margin: "0 auto 24px", lineHeight: 1.6 }}>
              Phase 1 has no database connected yet, so this confirms the import would succeed without writing it anywhere
              permanent. Connecting a database in Phase 2 makes this button persist real products to the catalog.
            </p>
            <Button variant="outline" onClick={reset} style={{ padding: "12px 22px", fontSize: 13 }}>
              Import Another File
            </Button>
          </div>
        </AdminCard>
      )}
    </div>
  );
}

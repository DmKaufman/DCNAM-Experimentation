import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { parseAndMapData } from "../utils/dataImport";
import "../styles/DataImportPanel.css";

export default function DataImportPanel({ onImportComplete }) {
  const [step, setStep] = useState("upload"); // "upload" | "mapping" | "preview" | "complete"
  const [file, setFile] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setLoading(true);

    try {
      let parsed;
      if (selectedFile.name.endsWith(".csv")) {
        parsed = await new Promise((resolve, reject) => {
          Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: true,
            complete: resolve,
            error: reject,
          });
        });
      } else if (selectedFile.name.endsWith(".xlsx") || selectedFile.name.endsWith(".xls")) {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet);
        parsed = { data };
      } else {
        throw new Error("Please upload a CSV or Excel file");
      }

      setFile(selectedFile);
      setRawData(parsed.data || []);
      setStep("mapping");
    } catch (err) {
      setError(err.message || "Failed to parse file");
    } finally {
      setLoading(false);
    }
  };

  const handleMapping = (columnMappings) => {
    try {
      const { preview, errors } = parseAndMapData(rawData, columnMappings);
      if (errors.length > 0) {
        setError(`Validation errors: ${errors.join(", ")}`);
        return;
      }
      setColumnMapping(columnMappings);
      setPreviewData(preview);
      setStep("preview");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = () => {
    if (onImportComplete) {
      onImportComplete(previewData);
    }
    setStep("complete");
  };

  const reset = () => {
    setStep("upload");
    setFile(null);
    setRawData(null);
    setColumnMapping({});
    setPreviewData(null);
    setError(null);
  };

  return (
    <div className="data-import-panel">
      <div className="data-import-panel__header">
        <h2>Import Data</h2>
        {step !== "upload" && (
          <button className="data-import-panel__close" onClick={reset}>
            ✕
          </button>
        )}
      </div>

      {error && <div className="data-import-panel__error">{error}</div>}

      {step === "upload" && <UploadStep onFileSelect={handleFileSelect} loading={loading} />}
      {step === "mapping" && rawData && <MappingStep data={rawData} onMapping={handleMapping} />}
      {step === "preview" && previewData && (
        <PreviewStep data={previewData} onImport={handleImport} onBack={() => setStep("mapping")} />
      )}
      {step === "complete" && <CompleteStep onReset={reset} />}
    </div>
  );
}

function UploadStep({ onFileSelect, loading }) {
  return (
    <div className="import-step">
      <p className="import-step__description">
        Upload a CSV or Excel file with building/hall data. Any column format is supported.
      </p>
      <label className="import-step__upload">
        <input type="file" accept=".csv,.xlsx,.xls" onChange={onFileSelect} disabled={loading} />
        <span>{loading ? "Processing..." : "Choose file or drag here"}</span>
      </label>
      <p className="import-step__hint">Supports: CSV, XLSX, XLS</p>
    </div>
  );
}

function MappingStep({ data, onMapping }) {
  const [mappings, setMappings] = useState({});
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const dataFields = [
    "building",
    "hall",
    "location",
    "racksPerRow",
    "aislePairs",
    "coldAisleWidth",
    "hotAisleWidth",
    "pduCount",
    "deskCols",
    "faultCount",
    "utilization",
  ];

  const handleMappingChange = (dataField, column) => {
    setMappings((prev) => ({ ...prev, [dataField]: column || null }));
  };

  return (
    <div className="import-step">
      <p className="import-step__description">Map your columns to data fields:</p>
      <div className="mapping-grid">
        {dataFields.map((field) => (
          <div key={field} className="mapping-row">
            <label className="mapping-label">{field}</label>
            <select
              value={mappings[field] || ""}
              onChange={(e) => handleMappingChange(field, e.target.value)}
            >
              <option value="">-- Not mapped --</option>
              {columns.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="import-step__actions">
        <button className="btn btn-primary" onClick={() => onMapping(mappings)}>
          Next: Review
        </button>
      </div>
    </div>
  );
}

function PreviewStep({ data, onImport, onBack }) {
  return (
    <div className="import-step">
      <p className="import-step__description">Review the data to be imported:</p>
      <div className="preview-table">
        <table>
          <thead>
            <tr>
              <th>Building</th>
              <th>Hall</th>
              <th>Racks/Row</th>
              <th>PDUs</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, idx) => (
              <tr key={idx}>
                <td>{row.building}</td>
                <td>{row.hall}</td>
                <td>{row.racksPerRow}</td>
                <td>{row.pduCount}</td>
                <td className={`status status--${row.status}`}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 10 && <p className="preview-table__more">... and {data.length - 10} more</p>}
      </div>
      <div className="import-step__actions">
        <button className="btn btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn btn-primary" onClick={onImport}>
          Import {data.length} Items
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ onReset }) {
  return (
    <div className="import-step">
      <div className="import-step__success">✓</div>
      <h3>Import Complete!</h3>
      <p>Your data has been successfully imported and the visualizations have been updated.</p>
      <button className="btn btn-primary" onClick={onReset}>
        Import More Data
      </button>
    </div>
  );
}

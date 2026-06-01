import type { ExportFormat } from "@smoke-tracker/shared";
import { useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";

export function SettingsPage() {
  const auth = useAuth();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  async function downloadExport(format: ExportFormat) {
    setExportingFormat(format);
    setExportError(null);

    try {
      const { job } = await api.createExport({ format });
      const { url } = await api.exportDownloadUrl(job.id);
      window.location.assign(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setExportingFormat(null);
    }
  }

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Account and export actions</p>
        </div>
      </div>
      <div className="panel settings-grid">
        <label>
          Display name
          <input type="text" value={auth.user?.displayName ?? ""} readOnly />
        </label>
        <label>
          Email
          <input type="email" value={auth.user?.email ?? ""} readOnly />
        </label>
        <label>
          Timezone
          <input type="text" value={auth.user?.timezone ?? ""} readOnly />
        </label>
        <div className="export-actions">
          <button type="button" onClick={() => downloadExport("csv")} disabled={exportingFormat !== null}>
            {exportingFormat === "csv" ? "Preparing CSV" : "Download CSV"}
          </button>
          <button
            type="button"
            className="button-link secondary"
            onClick={() => downloadExport("json")}
            disabled={exportingFormat !== null}
          >
            {exportingFormat === "json" ? "Preparing JSON" : "Download JSON"}
          </button>
        </div>
        {exportError ? <p className="error-text">{exportError}</p> : null}
      </div>
    </section>
  );
}

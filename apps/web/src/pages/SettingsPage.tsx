import { exportUrl } from "../lib/api";
import { useAuth } from "../lib/auth";

export function SettingsPage() {
  const auth = useAuth();

  return (
    <section className="page">
      <div className="page-heading">
        <div>
          <h1>Settings</h1>
          <p>Account and local export actions</p>
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
          <a className="button-link" href={exportUrl("csv")}>
            Download CSV
          </a>
          <a className="button-link secondary" href={exportUrl("json")}>
            Download JSON
          </a>
        </div>
      </div>
    </section>
  );
}

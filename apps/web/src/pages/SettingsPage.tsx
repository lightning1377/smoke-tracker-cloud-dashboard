export function SettingsPage() {
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Settings</h1>
        </div>
      </div>
      <div className="panel settings-grid">
        <label>
          Display name
          <input type="text" defaultValue="Demo User" />
        </label>
        <label>
          Timezone
          <input type="text" defaultValue="UTC" />
        </label>
      </div>
    </section>
  );
}

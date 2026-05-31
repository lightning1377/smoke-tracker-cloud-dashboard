export function LogsPage() {
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">History</p>
          <h1>Logs</h1>
        </div>
        <button type="button">Add log</button>
      </div>
      <div className="panel empty-state">No logs match the current filters.</div>
    </section>
  );
}

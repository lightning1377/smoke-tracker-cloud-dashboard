export function ExportsPage() {
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Data portability</p>
          <h1>Exports</h1>
        </div>
        <button type="button">Start export</button>
      </div>
      <div className="panel empty-state">CSV and JSON export jobs will appear here.</div>
    </section>
  );
}

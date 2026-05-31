export function GoalsPage() {
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Reduction planning</p>
          <h1>Goals</h1>
        </div>
        <button type="button">New goal</button>
      </div>
      <div className="panel empty-state">Active goals will appear here.</div>
    </section>
  );
}

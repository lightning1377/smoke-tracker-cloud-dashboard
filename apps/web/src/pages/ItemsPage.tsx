export function ItemsPage() {
  return (
    <section>
      <div className="page-header">
        <div>
          <p className="eyebrow">Smoke catalog</p>
          <h1>Items</h1>
        </div>
        <button type="button">New item</button>
      </div>
      <div className="panel empty-state">No smoke items yet.</div>
    </section>
  );
}

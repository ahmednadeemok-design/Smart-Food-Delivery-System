export default function DataTable({ columns, rows }) {
  return (
    <div className="card">
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col.key}>{col.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} style={{ color: "var(--muted)", padding: 18, textAlign: "center" }}>
                  No records found.
                </td>
              </tr>
            )}
            {rows.map((row, index) => (
              <tr key={row._id || index}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-cards">
        {rows.length === 0 && <div className="empty-state">No records found.</div>}
        {rows.map((row, index) => (
          <div className="card data-card" key={row._id || index}>
            {columns.map((col) => (
              <div className="data-card-row" key={col.key}>
                <span className="data-card-label">{col.label}</span>
                <span>{col.render ? col.render(row) : row[col.key]}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

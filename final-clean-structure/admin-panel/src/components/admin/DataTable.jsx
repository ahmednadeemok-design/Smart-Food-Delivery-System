export default function DataTable({ columns, rows }) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
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
  );
}

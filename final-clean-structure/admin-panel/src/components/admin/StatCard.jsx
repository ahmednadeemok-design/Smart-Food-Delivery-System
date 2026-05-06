export default function StatCard({ title, value, subtitle }) {
  return (
    <div className="card">
      <p className="muted">{title}</p>
      <h2>{value}</h2>
      <p className="muted">{subtitle}</p>
    </div>
  );
}

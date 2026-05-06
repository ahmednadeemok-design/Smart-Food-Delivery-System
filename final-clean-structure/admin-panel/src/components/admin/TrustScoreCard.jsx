export default function TrustScoreCard({ name, type, score }) {
  const badgeClass = score >= 85 ? "success" : score >= 70 ? "warning" : "danger";

  return (
    <div className="card">
      <span className={`badge ${badgeClass}`}>{type}</span>
      <h3>{name}</h3>
      <h1>{score}%</h1>
      <div className="progress-bg">
        <div
          className="progress-fill"
          style={{
            width: `${score}%`,
            background: score >= 85 ? "var(--success)" : score >= 70 ? "var(--warning)" : "var(--danger)",
          }}
        />
      </div>
    </div>
  );
}

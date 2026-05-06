import { mockQualityAudits } from "../utils/mockData.js";
import { getTasteRisk } from "../features/tasteGuarantee/tasteRules.js";

export default function QualityAudit() {
  return (
    <section className="page">
      <div className="container">
        <h1>Quality Audit & Taste Guarantee</h1>
        <p className="muted">
          Detect dishes with low taste score and repeated complaints.
        </p>

        <div className="grid">
          {mockQualityAudits.map((item) => (
            <div className="card" key={item.dish}>
              <span className="badge">{getTasteRisk(item.tasteScore)}</span>
              <h2>{item.dish}</h2>
              <p>Taste Score: <b>{item.tasteScore}%</b></p>
              <p>Complaints: <b>{item.complaints}</b></p>
              <p>Sentiment: <b>{item.sentiment}</b></p>
              {item.tasteScore < 60 && (
                <p style={{ color: "var(--danger)" }}>
                  Warning: This item should be reviewed or temporarily hidden.
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

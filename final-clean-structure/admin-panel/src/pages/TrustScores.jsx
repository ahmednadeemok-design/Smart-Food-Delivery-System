import TrustScoreCard from "../components/admin/TrustScoreCard.jsx";
import { mockUsers, mockRiders, mockRestaurants } from "../utils/mockData.js";

export default function TrustScores() {
  const combined = [
    ...mockUsers.map((u) => ({ name: u.name, type: u.role, score: u.trustScore })),
    ...mockRiders.map((r) => ({ name: r.name, type: "rider", score: r.trustScore })),
    ...mockRestaurants.map((r) => ({ name: r.name, type: "restaurant", score: r.trustScore })),
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Trust Scores</h1>
        <p className="muted">
          Tracks customer, rider, and restaurant reliability to reduce fraud and improve accountability.
        </p>
        <div className="grid grid-3">
          {combined.map((item, index) => (
            <TrustScoreCard key={index} name={item.name} type={item.type} score={item.score} />
          ))}
        </div>
      </div>
    </section>
  );
}

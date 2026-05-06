import { useState } from "react";
import { calculateFreshnessScore, calculateKitchenLoad, calculateDeliveryCost, getRecommendations } from "../services/aiService.js";

export default function HealthDashboard() {
  const [results, setResults] = useState({});
  const [recommendations, setRecommendations] = useState([]);

  const runDemo = async () => {
    const [freshness, kitchen, cost, recommended] = await Promise.all([
      calculateFreshnessScore({ estimatedMinutes: 30, actualMinutes: 42, weather: "rain" }),
      calculateKitchenLoad({ activeOrders: 13 }),
      calculateDeliveryCost({ distanceKm: 5, demandFactor: 1.2, weatherFactor: 1.1 }),
      getRecommendations(),
    ]);

    setResults({
      freshness: freshness.data.data.score,
      kitchen: kitchen.data.data.load,
      cost: cost.data.data.total,
    });
    setRecommendations(recommended.data.data || []);
  };

  return (
    <section className="page">
      <div className="container">
        <h1>AI & Health Dashboard</h1>
        <div className="grid grid-3">
          <div className="card">
            <h3>Calorie Tracking</h3>
            <p className="muted">Track daily calories and goal-based food suggestions.</p>
          </div>
          <div className="card">
            <h3>Freshness Score</h3>
            <p>{results.freshness ? `${results.freshness}%` : "Run demo to calculate"}</p>
          </div>
          <div className="card">
            <h3>Kitchen Load</h3>
            <p>{results.kitchen || "Run demo to calculate"}</p>
          </div>
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Transparent Delivery Cost</h3>
          <p>{results.cost ? `Rs. ${results.cost}` : "Run demo to calculate"}</p>
          <button className="btn" onClick={runDemo}>Run AI Demo</button>
        </div>
        <div className="card" style={{ marginTop: 18 }}>
          <h3>Recommended Narowal Food</h3>
          {recommendations.slice(0, 5).map((item) => (
            <p key={item.id || item.name}><b>{item.name}</b> - {item.calories || 0} kcal - Rs. {item.price || 0}</p>
          ))}
          {recommendations.length === 0 && <p className="muted">Run demo to load health-aware Narowal recommendations.</p>}
        </div>
      </div>
    </section>
  );
}

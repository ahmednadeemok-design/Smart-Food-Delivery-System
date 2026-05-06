import { Link } from "react-router-dom";
import HeatMapPlaceholder from "../components/map/HeatMapPlaceholder.jsx";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="badge">Narowal city food delivery</span>
          <h1>SmartFood Narowal</h1>
          <p>
            Order from Palmer Restaurant, Buddy's Narowal, City Restaurant, Anbala Sweets, ZFC, Virsa, and other local
            Narowal spots with COD, transparent fees, OTP delivery verification, and AI-backed recommendations.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
            <Link className="btn" to="/restaurants">Explore Restaurants</Link>
            <Link className="btn outline" to="/register">Create Account</Link>
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container grid grid-3">
          <div className="card">
            <h3>Narowal Zones</h3>
            <p className="muted">UET Campus, Main Bazaar, Circular Road, Railway Road, DHQ area, and Shakargarh Road coverage.</p>
          </div>
          <div className="card">
            <h3>COD + OTP</h3>
            <p className="muted">Cash on delivery stays simple, while OTP confirmation protects customers, riders, and restaurants.</p>
          </div>
          <div className="card">
            <h3>Smart Operations</h3>
            <p className="muted">Kitchen load, freshness score, complaints, refunds, trust score, and rider workload are connected.</p>
          </div>
        </div>
      </section>

      <section className="page">
        <div className="container">
          <HeatMapPlaceholder />
        </div>
      </section>
    </>
  );
}

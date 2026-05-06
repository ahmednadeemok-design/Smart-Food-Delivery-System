import { Link } from "react-router-dom";
import HeatMapPlaceholder from "../components/map/HeatMapPlaceholder.jsx";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="badge">FYP-level intelligent food delivery</span>
          <h1>Smart Food Delivery with AI, OTP verification, and trust scoring.</h1>
          <p>
            A Foodpanda-style system with advanced missing features: AI recommendations, kitchen load, complaint resolver,
            freshness score, health tracking, transparent delivery cost, and delivery OTP.
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
            <h3>AI Recommendation</h3>
            <p className="muted">Suggest food based on past orders, time, location, and health goal.</p>
          </div>
          <div className="card">
            <h3>Delivery OTP</h3>
            <p className="muted">Reduce fake delivery disputes using customer verification.</p>
          </div>
          <div className="card">
            <h3>Complaint AI</h3>
            <p className="muted">Resolve late delivery, missing item, and quality issues faster.</p>
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

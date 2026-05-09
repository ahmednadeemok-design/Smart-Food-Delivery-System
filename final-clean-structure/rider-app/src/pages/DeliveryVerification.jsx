import { Link } from "react-router-dom";

export default function DeliveryVerification() {
  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 620 }}>
        <div className="card">
          <span className="badge">Active Delivery</span>
          <h1>OTP moved to Active Delivery</h1>
          <p className="muted">OTP verification is available inside Active Delivery.</p>
          <Link className="btn" to="/active-delivery">Open Active Delivery</Link>
        </div>
      </div>
    </section>
  );
}

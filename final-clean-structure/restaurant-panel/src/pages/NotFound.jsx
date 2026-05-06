import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page">
      <div className="container card">
        <h1>404</h1>
        <p className="muted">Page not found.</p>
        <Link className="btn" to="/dashboard">Back to Dashboard</Link>
      </div>
    </section>
  );
}

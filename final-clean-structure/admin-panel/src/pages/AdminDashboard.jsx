import StatCard from "../components/admin/StatCard.jsx";
import { useAuth } from "../store/AuthContext.jsx";

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <section className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 18 }}>
          <span className="badge">Admin Control Center</span>
          <h1>Welcome, {user?.name || "Admin"}</h1>
          <p className="muted">
            Monitor users, riders, restaurants, complaints, refunds, trust score, and platform analytics.
          </p>
        </div>

        <div className="grid grid-4">
          <StatCard title="Total Users" value="1,248" subtitle="Customers, riders, restaurants" />
          <StatCard title="Today Orders" value="342" subtitle="Live platform activity" />
          <StatCard title="Open Complaints" value="17" subtitle="Need admin review" />
          <StatCard title="Revenue" value="Rs. 84,300" subtitle="Today gross revenue" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>System Health</h3>
            <p className="muted">Backend API, database, and real-time services monitoring placeholder.</p>
            <span className="badge success">Operational</span>
          </div>
          <div className="card">
            <h3>FYP Highlights</h3>
            <p className="muted">
              This admin panel demonstrates complaint AI decisions, trust score, refund handling, and fraud risk monitoring.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

import StatCard from "../components/admin/StatCard.jsx";
import { calculatePlatformStats } from "../features/platformAnalytics/analytics.js";

export default function Analytics() {
  const stats = calculatePlatformStats({ users: 1248, orders: 342, revenue: 84300 });

  return (
    <section className="page">
      <div className="container">
        <h1>Platform Analytics</h1>
        <p className="muted">High-level platform performance and business insights.</p>

        <div className="grid grid-4">
          <StatCard title="Users" value={stats.users} subtitle="Registered platform users" />
          <StatCard title="Orders" value={stats.orders} subtitle="Orders today" />
          <StatCard title="Revenue" value={`Rs. ${stats.revenue}`} subtitle="Gross revenue today" />
          <StatCard title="Avg / Order" value={`Rs. ${stats.avgRevenuePerOrder}`} subtitle="Average revenue per order" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>Demand Heatmap Placeholder</h3>
            <p className="muted">Will show high-demand delivery zones and rider density.</p>
            <div style={{
              height: 260,
              borderRadius: 18,
              border: "1px dashed var(--accent)",
              background: "radial-gradient(circle at 30% 30%, #bfdbfe, transparent 25%), radial-gradient(circle at 70% 60%, #93c5fd, transparent 25%), #eff6ff"
            }} />
          </div>
          <div className="card">
            <h3>Fraud Monitoring</h3>
            <p className="muted">Detect repeat fake complaints and abnormal refund behavior.</p>
            <span className="badge warning">Medium Risk Zone: Pizza Corner</span>
          </div>
        </div>
      </div>
    </section>
  );
}

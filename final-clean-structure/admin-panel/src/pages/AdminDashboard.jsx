import { useEffect, useState } from "react";
import StatCard from "../components/admin/StatCard.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { getSystemHealth } from "../services/systemService.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getSystemHealth().then((res) => setHealth(res.data.data)).catch(() => {});
  }, []);

  const collections = health?.collections || {};
  const signals = health?.signals || {};

  return (
    <section className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 18 }}>
          <span className="badge">Admin Control Center</span>
          <h1>Welcome, {user?.name || "Admin"}</h1>
          <p className="muted">
            Monitor Narowal users, riders, restaurants, orders, complaints, refunds, trust score, and city-zone analytics.
          </p>
        </div>

        <div className="grid grid-4">
          <StatCard title="Total Users" value={collections.users || 0} subtitle="Customers, riders, restaurants" />
          <StatCard title="Active Orders" value={signals.activeOrders || 0} subtitle="Live Narowal delivery flow" />
          <StatCard title="Pending Approvals" value={signals.pendingApprovals || 0} subtitle="Restaurants and riders" />
          <StatCard title="Open Complaints" value={signals.openComplaints || 0} subtitle="Need admin review" />
          <StatCard title="Revenue" value={formatCurrency(signals.revenuePkr || 0)} subtitle="COD and paid orders" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>System Health</h3>
            <p className="muted">Backend API, MongoDB, rider availability, and Narowal city operating zones.</p>
            <span className="badge success">Operational</span>
          </div>
          <div className="card">
            <h3>FYP Highlights</h3>
            <p className="muted">
              Zones: {(signals.narowalZones || ["Main Bazaar", "UET Narowal Campus", "Railway Road"]).join(", ")}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

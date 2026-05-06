import { useEffect, useState } from "react";
import StatCard from "../components/admin/StatCard.jsx";
import { getSystemHealth } from "../services/systemService.js";

export default function SystemHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    getSystemHealth().then((res) => setHealth(res.data.data)).catch(() => {});
  }, []);

  const collections = health?.collections || {};

  return (
    <section className="page">
      <div className="container">
        <h1>System Health</h1>
        <p className="muted">API, database, and operational collection overview.</p>
        <div className="grid grid-3">
          <StatCard title="API" value={health?.api || "unknown"} subtitle={`Uptime ${Math.round(health?.uptime || 0)}s`} />
          <StatCard title="Database" value={health?.database || "unknown"} subtitle="MongoDB connection" />
          <StatCard title="Open Complaints" value={health?.signals?.openComplaints || 0} subtitle="Needs review" />
          <StatCard title="Online Riders" value={health?.signals?.onlineRiders || 0} subtitle="Narowal active riders" />
          <StatCard title="Active Orders" value={health?.signals?.activeOrders || 0} subtitle="Current order flow" />
          <StatCard title="Revenue PKR" value={health?.signals?.revenuePkr || 0} subtitle="COD and paid totals" />
        </div>
        <div className="grid grid-3" style={{ marginTop: 18 }}>
          {Object.entries(collections).map(([key, value]) => (
            <StatCard key={key} title={key} value={value} subtitle="documents" />
          ))}
        </div>
      </div>
    </section>
  );
}

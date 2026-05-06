import StatCard from "../components/admin/StatCard.jsx";
import AdminMap from "../components/admin/AdminMap.jsx";
import { calculatePlatformStats } from "../features/platformAnalytics/analytics.js";

export default function Analytics() {
  const stats = calculatePlatformStats({ users: 1248, orders: 342, revenue: 84300 });
  // approximate coordinates for demo
  const center = { lat: 32.1020, lng: 74.8740 };
  const zones = [
    "Main Bazaar 32.1008, 74.8712",
    "UET Narowal 32.1135, 74.8734",
    "Railway Road 32.0990, 74.8678",
    "DHQ Hospital area 32.1058, 74.8792",
  ];
  const mapPoints = [
    { label: "Main Bazaar", lat: 32.1008, lng: 74.8712 },
    { label: "UET Narowal Campus", lat: 32.1135, lng: 74.8734 },
    { label: "Railway Road", lat: 32.0990, lng: 74.8678 },
    { label: "DHQ Hospital area", lat: 32.1058, lng: 74.8792 },
    center && { label: "Narowal City Center", ...center },
  ].filter(Boolean);

  return (
    <section className="page">
      <div className="container">
        <h1>Platform Analytics</h1>
        <p className="muted">Narowal city performance across Main Bazaar, Circular Road, College Road, Railway Road, and UET Narowal zones.</p>

        <div className="grid grid-4">
          <StatCard title="Users" value={stats.users} subtitle="Registered platform users" />
          <StatCard title="Orders" value={stats.orders} subtitle="Orders today" />
          <StatCard title="Revenue" value={`Rs. ${stats.revenue}`} subtitle="Gross revenue today" />
          <StatCard title="Avg / Order" value={`Rs. ${stats.avgRevenuePerOrder}`} subtitle="Average revenue per order" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>Narowal Demand Heatmap</h3>
            <p className="muted">Hot zones: Main Bazaar lunch rush, College Road fast-food evening demand, and UET Narowal hostel deliveries.</p>
            <AdminMap points={mapPoints} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {zones.map((zone) => <span className="badge" key={zone}>{zone}</span>)}
            </div>
          </div>
          <div className="card">
            <h3>Fraud Monitoring</h3>
            <p className="muted">Detect repeat fake complaints and abnormal refund behavior.</p>
            <span className="badge warning">Medium Risk Zone: College Road fast-food cluster</span>
          </div>
        </div>
      </div>
    </section>
  );
}

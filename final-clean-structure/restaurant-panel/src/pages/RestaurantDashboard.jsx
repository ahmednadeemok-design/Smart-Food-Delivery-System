import StatCard from "../components/restaurant/StatCard.jsx";
import KitchenLoadMeter from "../components/restaurant/KitchenLoadMeter.jsx";
import { useAuth } from "../store/AuthContext.jsx";

export default function RestaurantDashboard() {
  const { user } = useAuth();

  return (
    <section className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 18 }}>
          <span className="badge">Restaurant Panel</span>
          <h1>Welcome, {user?.name || "Restaurant Owner"}</h1>
          <p className="muted">
            Manage orders, kitchen load, menu, accuracy prediction, and quality audits.
          </p>
        </div>

        <div className="grid grid-3">
          <StatCard title="Today Orders" value="27" subtitle="8 orders currently active" />
          <StatCard title="Accuracy Rate" value="94%" subtitle="Based on wrong/missing item complaints" />
          <StatCard title="Trust Score" value="89%" subtitle="Restaurant accountability score" />
        </div>

        <div style={{ marginTop: 18 }}>
          <KitchenLoadMeter activeOrders={8} />
        </div>
      </div>
    </section>
  );
}

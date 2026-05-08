import { useEffect, useState } from "react";
import StatCard from "../components/restaurant/StatCard.jsx";
import KitchenLoadMeter from "../components/restaurant/KitchenLoadMeter.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { getRestaurantOrders } from "../services/orderService.js";
import { getMyRestaurants } from "../services/restaurantService.js";

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const loadDashboard = () => {
      getRestaurantOrders().then((res) => setOrders(res.data.data || [])).catch(() => {});
      getMyRestaurants().then((res) => setRestaurants(res.data.data || [])).catch(() => {});
    };
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;
  const todayRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const primaryRestaurant = restaurants[0];

  return (
    <section className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 18 }}>
          <span className="badge">{primaryRestaurant?.isOpen === false ? "Closed" : "Open for Narowal orders"}</span>
          <h1>{primaryRestaurant?.name || `Welcome, ${user?.name || "Restaurant Owner"}`}</h1>
          <p className="muted">
            Manage orders, kitchen load, menu, accuracy prediction, and Narowal delivery operations.
          </p>
        </div>

        <div className="grid grid-3">
          <StatCard title="Orders" value={orders.length} subtitle={`${activeOrders} currently active`} />
          <StatCard title="Revenue" value={`Rs. ${todayRevenue.toLocaleString("en-PK")}`} subtitle="Visible order value" />
          <StatCard title="Trust Score" value={`${primaryRestaurant?.trustScore || 100}%`} subtitle="Restaurant accountability score" />
        </div>

        <div style={{ marginTop: 18 }}>
          <KitchenLoadMeter activeOrders={activeOrders} />
        </div>
      </div>
    </section>
  );
}

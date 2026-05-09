import { useEffect, useMemo, useState } from "react";
import StatCard from "../components/admin/StatCard.jsx";
import AdminMap from "../components/admin/AdminMap.jsx";
import { calculatePlatformStats } from "../features/platformAnalytics/analytics.js";
import { getAdminOrders, getAdminRestaurants, getAdminRiders, getAdminUsers, getFinanceSummary } from "../services/adminService.js";
import socket from "../services/socket.js";

export default function Analytics() {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [riders, setRiders] = useState([]);
  const [finance, setFinance] = useState(null);

  const loadAnalytics = () => {
    Promise.all([getAdminUsers(), getAdminOrders(), getAdminRestaurants(), getAdminRiders()])
      .then(([usersRes, ordersRes, restaurantsRes, ridersRes]) => {
        setUsers(usersRes.data.data || []);
        const orderPayload = ordersRes.data.data || {};
        setOrders(orderPayload.orders || (Array.isArray(orderPayload) ? orderPayload : []));
        setRestaurants(restaurantsRes.data.data || []);
        setRiders(ridersRes.data.data || []);
      })
      .catch(() => {});
    getFinanceSummary().then((res) => setFinance(res.data.data?.totals || null)).catch(() => {});
  };

  useEffect(() => {
    loadAnalytics();
    socket.emit("join-role-rooms");
    socket.on("admin:order-lifecycle", loadAnalytics);
    socket.on("admin:rider-updated", loadAnalytics);
    socket.on("admin:restaurant-updated", loadAnalytics);
    socket.on("admin:refund-updated", loadAnalytics);
    return () => {
      socket.off("admin:order-lifecycle", loadAnalytics);
      socket.off("admin:rider-updated", loadAnalytics);
      socket.off("admin:restaurant-updated", loadAnalytics);
      socket.off("admin:refund-updated", loadAnalytics);
    };
  }, []);

  const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
  const stats = calculatePlatformStats({ users: users.length, orders: orders.length, revenue });
  const mapPoints = useMemo(() => [
    ...restaurants.map((restaurant) => ({ label: restaurant.name, ...(restaurant.location || {}) })),
    ...riders.map((rider) => ({ label: `Rider: ${rider.user?.name || "Rider"}`, ...(rider.currentLocation || {}) })),
    ...orders.map((order) => ({ label: `Order ${String(order._id).slice(-6)} ${order.status}`, ...(order.deliveryLocation || {}) })),
  ], [restaurants, riders, orders]);
  const zones = restaurants.slice(0, 6).map((restaurant) => `${restaurant.localArea || "Narowal"} ${restaurant.name}`);

  return (
    <section className="page">
      <div className="container">
        <h1>Platform Analytics</h1>
        <p className="muted">Narowal city performance across Main Bazaar, Circular Road, Railway Road, UET Narowal Campus, and DHQ Hospital Area zones.</p>

        <div className="grid grid-4">
          <StatCard title="Users" value={stats.users} subtitle="Registered platform users" />
          <StatCard title="Orders" value={stats.orders} subtitle="Orders today" />
          <StatCard title="Revenue" value={`Rs. ${Number(stats.revenue).toLocaleString("en-PK")}`} subtitle="Visible gross revenue" />
          <StatCard title="Avg / Order" value={`Rs. ${stats.avgRevenuePerOrder}`} subtitle="Average revenue per order" />
          <StatCard title="Platform Earnings" value={`Rs. ${Number(finance?.platformEarnings || 0).toLocaleString("en-PK")}`} subtitle="Commission + fees" />
          <StatCard title="Restaurant Settlement" value={`Rs. ${Number(finance?.pendingRestaurantSettlement || 0).toLocaleString("en-PK")}`} subtitle="Pending partner payout" />
          <StatCard title="Rider Payouts" value={`Rs. ${Number(finance?.pendingRiderPayout || 0).toLocaleString("en-PK")}`} subtitle="Pending rider payout" />
          <StatCard title="COD Collected" value={`Rs. ${Number(finance?.collectedCod || 0).toLocaleString("en-PK")}`} subtitle="Cash handled by riders" />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>Narowal Demand Heatmap</h3>
            <p className="muted">Live operational markers from restaurants, riders, and order drop-offs.</p>
            <AdminMap points={mapPoints} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {zones.map((zone) => <span className="badge" key={zone}>{zone}</span>)}
            </div>
          </div>
          <div className="card">
            <h3>Fraud Monitoring</h3>
            <p className="muted">Detect repeat fake complaints and abnormal refund behavior.</p>
            <span className="badge warning">Medium Risk Zone: UET Narowal Campus fast-food cluster</span>
          </div>
        </div>
      </div>
    </section>
  );
}

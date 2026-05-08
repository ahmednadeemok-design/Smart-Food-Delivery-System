import { useEffect, useState } from "react";
import StatCard from "../components/rider/StatCard.jsx";
import { getRiderEarnings, getRiderHistory } from "../services/riderService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function RiderHistory() {
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);

  useEffect(() => {
    getRiderHistory().then((res) => setHistory(res.data.data || [])).catch((err) => toast.error(err.message));
    getRiderEarnings().then((res) => setEarnings(res.data.data || null)).catch(() => {});
  }, []);

  return (
    <section className="page">
      <div className="container">
        <h1>Delivery History</h1>
        <p className="muted">Completed deliveries, COD collection, and payout performance for Narowal operations.</p>
        <div className="grid grid-3" style={{ marginBottom: 18 }}>
          <StatCard title="Total Earnings" value={formatCurrency(earnings?.totalEarnings || 0)} subtitle="Lifetime delivery earnings" />
          <StatCard title="Pending Payout" value={formatCurrency(earnings?.pendingPayout || 0)} subtitle="Awaiting payout processing" />
          <StatCard title="Completed" value={earnings?.completedDeliveries || 0} subtitle="Delivered orders" />
        </div>
        <div className="grid">
          {history.map((order) => (
            <div className="card order-card" key={order._id}>
              <span className={`badge ${order.status === "delivered" ? "success" : "warning"}`}>{order.status}</span>
              <h3>{order.restaurant?.name || "Restaurant"} to {order.deliveryAddress}</h3>
              <p className="muted">{new Date(order.deliveredAt || order.updatedAt).toLocaleString()} - {order.restaurant?.localArea || "Narowal"}</p>
              <div className="action-row">
                <span className="badge">Earned {formatCurrency(order.riderEarning || 0)}</span>
                <span className="badge">Order {formatCurrency(order.totalAmount || 0)}</span>
                <span className="badge">{String(order.paymentMethod || "cod").toUpperCase()}</span>
              </div>
            </div>
          ))}
          {history.length === 0 && <div className="card">No completed delivery history yet.</div>}
        </div>
      </div>
    </section>
  );
}

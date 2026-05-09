import { useEffect, useState } from "react";
import StatCard from "../components/rider/StatCard.jsx";
import { getRiderEarnings, getRiderHistory } from "../services/riderService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function RiderHistory() {
  const [history, setHistory] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    getRiderHistory({ page, limit: 20 }).then((res) => {
      const payload = res.data.data || {};
      setHistory(payload.orders || (Array.isArray(payload) ? payload : []));
      setPagination(payload.pagination || { page: 1, pages: 1, total: 0 });
    }).catch((err) => toast.error(err.message));
    getRiderEarnings().then((res) => setEarnings(res.data.data || null)).catch(() => {});
  }, [page]);

  return (
    <section className="page">
      <div className="container">
        <h1>Delivery History</h1>
        <p className="muted">Completed deliveries are separate from Active Delivery. Earnings remain available without cluttering the live workflow.</p>
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
        <div className="action-row" style={{ marginTop: 16 }}>
          <button className="btn outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <span className="badge">{pagination.total || 0} deliveries / page {pagination.page || page} of {pagination.pages || 1}</span>
          <button className="btn outline" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}

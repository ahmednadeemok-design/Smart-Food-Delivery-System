import { useEffect, useState } from "react";
import OrderTable from "../components/restaurant/OrderTable.jsx";
import { getRestaurantOrders, updateOrderStatus } from "../services/orderService.js";
import { toast } from "../utils/toast.js";
import socket from "../services/socket.js";

const toTableOrder = (order) => ({
  _id: order._id,
  customer: order.customer?.name || "Customer",
  phone: order.customer?.phone || "",
  address: order.deliveryAddress || "Narowal delivery address",
  rider: order.rider?.user?.name || "",
  items: order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "Items",
  amount: order.totalAmount,
  paymentMethod: (order.paymentMethod || "cod").toUpperCase(),
  status: order.status,
  priority: order.emergencyMode ? "Emergency" : "Normal",
  createdAt: order.createdAt,
});

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("active");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadOrders = async () => {
    try {
      const res = await getRestaurantOrders({ view, status, page, limit: 20 });
      const payload = res.data.data || {};
      const restaurantOrders = payload.orders || (Array.isArray(payload) ? payload : []);
      setOrders(restaurantOrders.map(toTableOrder));
      setPagination(payload.pagination || { page: 1, pages: 1, total: restaurantOrders.length });
    } catch (err) {
      toast.error(err.message);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
    const reload = (payload) => {
      if (payload?.status) toast.success(`Order ${payload.status}`);
      else toast.success("Restaurant orders updated");
      loadOrders();
    };
    socket.emit("join-role-rooms");
    socket.on("restaurant:new-order", reload);
    socket.on("order-created", reload);
    socket.on("order-status-updated", reload);
    socket.on("restaurant:order-cancelled", reload);
    socket.on("restaurant:rider-assigned", reload);
    const interval = setInterval(loadOrders, 12000);
    return () => {
      clearInterval(interval);
      socket.off("restaurant:new-order", reload);
      socket.off("order-created", reload);
      socket.off("order-status-updated", reload);
      socket.off("restaurant:order-cancelled", reload);
      socket.off("restaurant:rider-assigned", reload);
    };
  }, [view, status, page]);

  const updateStatus = async (orderId, status) => {
    setOrders((prev) => prev.map((order) => order._id === orderId ? { ...order, status } : order));
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order ${orderId} moved to ${status}`);
    } catch (err) {
      toast.error(err.message);
      loadOrders();
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Orders</h1>
        <p className="muted">Live kitchen queue is separate from completed and cancelled order history.</p>
        <div className="card form" style={{ marginBottom: 18 }}>
          <div className="action-row">
            <button className={`btn ${view === "active" ? "" : "outline"}`} onClick={() => { setView("active"); setStatus(""); setPage(1); }}>Live Kitchen Queue</button>
            <button className={`btn ${view === "history" ? "" : "outline"}`} onClick={() => { setView("history"); setStatus(""); setPage(1); }}>Completed / Cancelled</button>
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {(view === "active" ? ["pending", "accepted", "preparing", "ready", "assigned", "picked"] : ["delivered", "cancelled", "rejected"]).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <p className="muted">{pagination.total || 0} orders found. Page {pagination.page || page} of {pagination.pages || 1}.</p>
        </div>
        <OrderTable orders={orders} onStatusChange={updateStatus} mode={view} />
        <div className="action-row" style={{ marginTop: 16 }}>
          <button className="btn outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button className="btn outline" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}

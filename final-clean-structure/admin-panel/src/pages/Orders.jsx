import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getAdminOrders, getAdminRiders, updateAdminOrder } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import socket from "../services/socket.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [status, setStatus] = useState("");
  const [view, setView] = useState("active");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadOrders = () => {
    getAdminOrders({ view, status, q: query, page, limit: 25 })
      .then((res) => {
        const payload = res.data.data || {};
        setOrders(payload.orders || (Array.isArray(payload) ? payload : []));
        setPagination(payload.pagination || { page: 1, pages: 1, total: 0 });
      })
      .catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    loadOrders();
    const reload = (payload) => {
      if (payload?.status) toast.success(`Live order update: ${payload.status}`);
      loadOrders();
    };
    socket.emit("join-role-rooms");
    socket.on("order-created", reload);
    socket.on("order-status-updated", reload);
    socket.on("admin:order-lifecycle", reload);
    getAdminRiders().then((res) => setRiders(res.data.data || [])).catch(() => {});
    return () => {
      socket.off("order-created", reload);
      socket.off("order-status-updated", reload);
      socket.off("admin:order-lifecycle", reload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, view, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadOrders();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateOrder = async (id, payload) => {
    try {
      await updateAdminOrder(id, payload);
      toast.success("Order updated");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const columns = [
    { key: "_id", label: "Order", render: (row) => <b>#{row._id.slice(-6).toUpperCase()}</b> },
    { key: "customer", label: "Customer", render: (row) => <div className="cell-main"><span className="cell-title">{row.customer?.name || "Customer"}</span><span className="cell-sub">{row.deliveryAddress || "Delivery address unavailable"}</span></div> },
    { key: "restaurant", label: "Restaurant", render: (row) => <div className="cell-main"><span className="cell-title">{row.restaurant?.name || "Restaurant"}</span><span className="cell-sub">{String(row.paymentMethod || "cod").toUpperCase()} / {row.paymentStatus || "pending"}</span></div> },
    { key: "rider", label: "Rider", render: (row) => row.rider?.user?.name ? <StatusBadge value={row.rider.user.name} /> : <StatusBadge value="Unassigned" /> },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "totalAmount", label: "Total", render: (row) => formatCurrency(row.totalAmount) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          <select aria-label="Update order status" value={row.status} onChange={(e) => updateOrder(row._id, { status: e.target.value, reason: "Admin forced order status" })}>
            {["pending", "accepted", "preparing", "ready", "assigned", "picked", "delivered", "cancelled", "rejected"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label="Assign rider" value={row.rider?._id || ""} onChange={(e) => e.target.value && updateOrder(row._id, { rider: e.target.value, reason: "Admin assigned rider" })}>
            <option value="">Assign rider</option>
            {riders.map((rider) => <option key={rider._id} value={rider._id}>{rider.user?.name || "Rider"}</option>)}
          </select>
          <button className="btn danger" onClick={() => window.confirm("Cancel this order?") && updateOrder(row._id, { status: "cancelled", reason: "Admin cancelled problematic order" })}>Cancel</button>
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <div className="container">
        <h1>Order Control</h1>
        <p className="muted">Live operations stay focused here. Delivered, cancelled, and rejected orders move into the archive/history view.</p>
        <div className="card form" style={{ marginBottom: 18 }}>
          <div className="action-row">
            <button className={`btn ${view === "active" ? "" : "outline"}`} onClick={() => { setView("active"); setStatus(""); setPage(1); }}>Active Orders</button>
            <button className={`btn ${view === "archived" ? "" : "outline"}`} onClick={() => { setView("archived"); setStatus(""); setPage(1); }}>Archived Orders</button>
          </div>
          <input className="input" placeholder="Search delivery address, payment, or status" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {(view === "active" ? ["pending", "accepted", "preparing", "ready", "assigned", "picked"] : ["delivered", "cancelled", "rejected"]).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <p className="muted">{pagination.total || 0} orders found. Page {pagination.page || page} of {pagination.pages || 1}.</p>
        </div>
        <DataTable columns={columns} rows={orders} />
        <div className="action-row" style={{ marginTop: 16 }}>
          <button className="btn outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button className="btn outline" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getAdminOrders, getAdminRiders, updateAdminOrder } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [status, setStatus] = useState("");

  const loadOrders = () => {
    getAdminOrders(status).then((res) => setOrders(res.data.data || [])).catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    loadOrders();
    getAdminRiders().then((res) => setRiders(res.data.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
    { key: "_id", label: "Order", render: (row) => row._id.slice(-6) },
    { key: "customer", label: "Customer", render: (row) => row.customer?.name || "Customer" },
    { key: "restaurant", label: "Restaurant", render: (row) => row.restaurant?.name || "Restaurant" },
    { key: "rider", label: "Rider", render: (row) => row.rider?.user?.name || "Unassigned" },
    { key: "status", label: "Status", render: (row) => <span className="badge">{row.status}</span> },
    { key: "totalAmount", label: "Total", render: (row) => formatCurrency(row.totalAmount) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          <select value={row.status} onChange={(e) => updateOrder(row._id, { status: e.target.value, reason: "Admin forced order status" })}>
            {["pending", "accepted", "preparing", "ready", "picked", "delivered", "cancelled"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={row.rider?._id || ""} onChange={(e) => e.target.value && updateOrder(row._id, { rider: e.target.value, reason: "Admin assigned rider" })}>
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
        <p className="muted">Monitor, filter, cancel, force-update status, and assign/reassign riders.</p>
        <div className="card form" style={{ marginBottom: 18 }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            {["pending", "accepted", "preparing", "ready", "picked", "delivered", "cancelled"].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <DataTable columns={columns} rows={orders} />
      </div>
    </section>
  );
}

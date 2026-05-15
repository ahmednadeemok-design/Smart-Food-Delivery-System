import { useEffect, useRef, useState } from "react";
import DataTable from "../components/admin/DataTable.jsx";
import { getAdminOrders, getAdminRiders, permanentlyDeleteAdminOrder, restoreAdminOrder, trashAdminOrder, updateAdminOrder } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import ContactActions from "../components/common/ContactActions.jsx";
import PortalActionMenu from "../components/common/PortalActionMenu.jsx";
import socket from "../services/socket.js";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [status, setStatus] = useState("");
  const [view, setView] = useState("active");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [confirmAction, setConfirmAction] = useState(null);
  const queuedContactRefresh = useRef(false);

  const loadOrders = () => {
    getAdminOrders({ view, status, q: query, from, to, page, limit: 25 })
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
      if (window.__SMARTFOOD_CONTACT_MODAL_OPEN) {
        queuedContactRefresh.current = true;
        return;
      }
      loadOrders();
    };
    const flushQueuedRefresh = (event) => {
      if (!event.detail?.open && queuedContactRefresh.current) {
        queuedContactRefresh.current = false;
        loadOrders();
      }
    };
    socket.emit("join-role-rooms");
    socket.on("order-created", reload);
    socket.on("order-status-updated", reload);
    socket.on("admin:order-lifecycle", reload);
    window.addEventListener("smartfood:contact-modal-state", flushQueuedRefresh);
    getAdminRiders().then((res) => setRiders(res.data.data || [])).catch(() => {});
    return () => {
      socket.off("order-created", reload);
      socket.off("order-status-updated", reload);
      socket.off("admin:order-lifecycle", reload);
      window.removeEventListener("smartfood:contact-modal-state", flushQueuedRefresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, view, page, query, from, to]);

  const updateOrder = async (id, payload) => {
    try {
      await updateAdminOrder(id, payload);
      toast.success("Order updated");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const runLifecycleAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === "trash") await trashAdminOrder(confirmAction.order._id, { reason: "Admin moved archived order to trash" });
      if (confirmAction.type === "restore") await restoreAdminOrder(confirmAction.order._id, { reason: "Admin restored order from trash" });
      if (confirmAction.type === "permanent") await permanentlyDeleteAdminOrder(confirmAction.order._id, { reason: "Admin confirmed permanent deletion" });
      toast.success(confirmAction.success);
      setConfirmAction(null);
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const moreActions = (row) => {
    if (view === "active") return null;
    const actions = [];
    if (view === "archived") {
      actions.push({ label: "Move to Trash", type: "trash", success: "Order moved to trash" });
    }
    if (view === "trash") {
      actions.push({ label: "Restore", type: "restore", success: "Order restored" });
      actions.push({ label: "Permanently Delete", type: "permanent", success: "Order permanently deleted" });
    }
    if (!actions.length) return null;
    return (
      <PortalActionMenu
        actions={actions.map((action) => ({
          label: action.label,
          danger: action.type === "permanent" || action.type === "trash",
          onClick: () => setConfirmAction({ ...action, order: row }),
        }))}
      />
    );
  };

  const columns = [
    { key: "_id", label: "Order", render: (row) => <b>#{row._id.slice(-6).toUpperCase()}</b> },
    { key: "customer", label: "Customer", render: (row) => <div className="cell-main"><span className="cell-title">{row.customer?.name || "Customer"}</span><span className="cell-sub">{row.deliveryAddress || "Delivery address unavailable"}</span></div> },
    { key: "restaurant", label: "Restaurant", render: (row) => <div className="cell-main"><span className="cell-title">{row.restaurant?.name || "Restaurant"}</span><span className="cell-sub">{String(row.paymentMethod || "cod").toUpperCase()} / {row.paymentStatus || "pending"}</span></div> },
    { key: "rider", label: "Rider", render: (row) => row.rider?.user?.name ? <StatusBadge value={row.rider.user.name} /> : <StatusBadge value="Unassigned" /> },
    {
      key: "contacts",
      label: "Contacts",
      render: (row) => (
        <div className="contact-grid">
          <ContactActions compact title={row.customer?.name || "Customer"} subtitle="Customer" phone={row.customer?.phone} location={row.deliveryLocation} address={row.deliveryAddress} />
          <ContactActions compact title={row.restaurant?.name || "Restaurant"} subtitle="Restaurant" phone={row.restaurant?.supportContact || row.restaurant?.phone} location={row.restaurant?.location} address={row.restaurant?.address} />
          {row.rider?.user && <ContactActions compact title={row.rider.user.name || "Rider"} subtitle="Rider" phone={row.rider.user.phone} location={row.rider?.currentLocation} />}
        </div>
      ),
    },
    { key: "status", label: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "totalAmount", label: "Total", render: (row) => formatCurrency(row.totalAmount) },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="action-row">
          {view === "active" && (
            <>
              <select aria-label="Update order status" value={row.status} onChange={(e) => updateOrder(row._id, { status: e.target.value, reason: "Admin forced order status" })}>
                {["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way", "delivered", "cancelled", "rejected"].map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select aria-label="Assign rider" value={row.rider?._id || ""} onChange={(e) => e.target.value && updateOrder(row._id, { rider: e.target.value, reason: "Admin assigned rider" })}>
                <option value="">Assign rider</option>
                {riders.map((rider) => <option key={rider._id} value={rider._id}>{rider.user?.name || "Rider"}</option>)}
              </select>
              <button className="btn danger" onClick={() => setConfirmAction({ type: "cancel", order: row, label: "Cancel Order", success: "Order cancelled" })}>Cancel</button>
            </>
          )}
          {moreActions(row)}
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
            <button className={`btn ${view === "trash" ? "" : "outline"}`} onClick={() => { setView("trash"); setStatus(""); setPage(1); }}>Trash Orders</button>
          </div>
          <input className="input" placeholder="Search order ID, restaurant, customer, delivery address, payment, or status" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} />
          <div className="action-row">
            <input className="input" type="date" aria-label="From date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
            <input className="input" type="date" aria-label="To date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {(view === "active" ? ["pending", "accepted", "preparing", "ready", "assigned", "picked", "on-the-way"] : ["delivered", "cancelled", "rejected"]).map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <p className="muted">{pagination.total || 0} orders found. Page {pagination.page || page} of {pagination.pages || 1}.</p>
        </div>
        <DataTable columns={columns} rows={orders} />
        <div className="action-row" style={{ marginTop: 16 }}>
          <button className="btn outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button className="btn outline" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
        </div>
        {confirmAction && (
          <div className="modal-backdrop" role="dialog" aria-modal="true">
            <div className="modal-card">
              <h3>Are you sure?</h3>
              <p className="muted">{confirmAction.label} for order #{confirmAction.order._id.slice(-6).toUpperCase()}.</p>
              <div className="action-row">
                <button className="btn outline" onClick={() => setConfirmAction(null)}>Cancel</button>
                <button
                  className={confirmAction.type === "permanent" || confirmAction.type === "trash" || confirmAction.type === "cancel" ? "btn danger" : "btn"}
                  onClick={() => confirmAction.type === "cancel" ? updateOrder(confirmAction.order._id, { status: "cancelled", reason: "Admin cancelled problematic order" }).then(() => setConfirmAction(null)) : runLifecycleAction()}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

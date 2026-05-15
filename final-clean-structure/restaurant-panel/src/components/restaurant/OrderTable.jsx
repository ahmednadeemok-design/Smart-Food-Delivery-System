import formatCurrency from "../../utils/formatCurrency.js";
import StatusBadge from "../common/StatusBadge.jsx";
import ContactActions from "../common/ContactActions.jsx";
import PortalActionMenu from "../common/PortalActionMenu.jsx";

export default function OrderTable({ orders, onStatusChange, onHideOrder, mode = "active" }) {
  const nextActions = {
    pending: [
      { status: "accepted", label: "Accept", className: "btn success" },
      { status: "rejected", label: "Reject", className: "btn danger" },
    ],
    accepted: [{ status: "preparing", label: "Mark Preparing", className: "btn" }],
    preparing: [{ status: "ready", label: "Mark Ready", className: "btn" }],
  };

  return (
    <div className="order-card-grid">
      {orders.length === 0 && (
        <div className="empty-state">
          <h3>No restaurant orders yet</h3>
          <p>{mode === "active" ? "New customer orders will appear here." : "Completed and cancelled orders will appear here."}</p>
        </div>
      )}
      {orders.map((order) => (
        <div className="card restaurant-order-card" key={order._id}>
          <div className="order-card-header">
            <div>
              <StatusBadge value={order.status} />
              <h3>Order #{String(order._id).slice(-6).toUpperCase()}</h3>
              <p className="muted">{order.priority} priority</p>
            </div>
            <h2>{formatCurrency(order.amount)}</h2>
          </div>
          <div className="order-detail-grid">
            <div className="detail-tile"><small>Customer</small><b>{order.customer}</b><p className="muted">{order.phone || "Phone hidden"}</p></div>
            <div className="detail-tile"><small>Delivery Address</small><b>{order.address}</b></div>
            <div className="detail-tile"><small>Items</small><b>{order.items}</b></div>
            <div className="detail-tile"><small>Payment</small><StatusBadge value={order.paymentMethod} /></div>
            <div className="detail-tile"><small>Rider</small><b>{order.rider || "A rider will be assigned after ready."}</b></div>
          </div>
          <div className="contact-grid">
            {order.contactPermissions?.restaurant?.customer && (
              <ContactActions
                title={order.customer}
                subtitle="Customer"
                phone={order.phone}
                location={order.deliveryLocation}
                address={order.address}
              />
            )}
            {order.contactPermissions?.restaurant?.rider && (
              <ContactActions title={order.rider || "Assigned rider"} subtitle="Rider" phone={order.riderPhone} />
            )}
          </div>
          <div className="order-card-footer">
            <p className="muted">
              {mode !== "active" ? "This order is in history." : nextActions[order.status] ? "Next action is ready below." : "No restaurant action is needed right now."}
            </p>
            <div className="action-row">
              {(mode === "active" ? nextActions[order.status] || [] : []).map((action) => (
                <button key={action.status} className={action.className} onClick={() => onStatusChange(order._id, action.status)}>
                  {action.label}
                </button>
              ))}
              {mode !== "active" && (
                <PortalActionMenu actions={[{ label: "Hide from History", danger: true, onClick: () => onHideOrder?.(order) }]} />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

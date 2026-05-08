import formatCurrency from "../../utils/formatCurrency.js";

export default function OrderTable({ orders, onStatusChange }) {
  const nextActions = {
    pending: [
      { status: "accepted", label: "Accept", className: "btn success" },
      { status: "rejected", label: "Reject", className: "btn danger" },
    ],
    accepted: [{ status: "preparing", label: "Mark Preparing", className: "btn" }],
    preparing: [{ status: "ready", label: "Mark Ready", className: "btn" }],
  };

  return (
    <div className="card order-list">
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Payment</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Rider</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan="8" style={{ color: "var(--muted)", padding: 18, textAlign: "center" }}>
                No restaurant orders yet.
              </td>
            </tr>
          )}
          {orders.map((order) => (
            <tr key={order._id}>
              <td>
                <b>#{String(order._id).slice(-6).toUpperCase()}</b>
                <div className="muted">{order.priority}</div>
              </td>
              <td>
                <b>{order.customer}</b>
                <div className="muted">{order.phone || "Phone hidden"}</div>
                <div className="muted">{order.address}</div>
              </td>
              <td>{order.items}</td>
              <td><span className="badge">{order.paymentMethod}</span></td>
              <td>{formatCurrency(order.amount)}</td>
              <td><span className="badge">{order.status}</span></td>
              <td>{order.rider || "Not assigned"}</td>
              <td>
                <div className="action-row" style={{ display: "flex", gap: 8 }}>
                  {(nextActions[order.status] || []).map((action) => (
                    <button key={action.status} className={action.className} onClick={() => onStatusChange(order._id, action.status)}>
                      {action.label}
                    </button>
                  ))}
                  {!nextActions[order.status] && <span className="muted">No restaurant action</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

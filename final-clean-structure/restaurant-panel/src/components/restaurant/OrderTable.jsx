import formatCurrency from "../../utils/formatCurrency.js";

export default function OrderTable({ orders, onStatusChange }) {
  return (
    <div className="card" style={{ overflowX: "auto" }}>
      <table className="table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan="7" style={{ color: "var(--muted)", padding: 18, textAlign: "center" }}>
                No restaurant orders yet.
              </td>
            </tr>
          )}
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order._id}</td>
              <td>{order.customer}</td>
              <td>{order.items}</td>
              <td>{formatCurrency(order.amount)}</td>
              <td><span className="badge">{order.status}</span></td>
              <td>{order.priority}</td>
              <td>
                <select value={order.status} onChange={(e) => onStatusChange(order._id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="assigned">Assigned</option>
                  <option value="picked">Picked</option>
                  <option value="delivered">Delivered</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {order.status === "pending" && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button className="btn success" onClick={() => onStatusChange(order._id, "accepted")}>Accept</button>
                    <button className="btn danger" onClick={() => onStatusChange(order._id, "rejected")}>Reject</button>
                  </div>
                )}
                {order.status === "accepted" && <button className="btn" style={{ marginTop: 8 }} onClick={() => onStatusChange(order._id, "preparing")}>Mark Preparing</button>}
                {order.status === "preparing" && <button className="btn" style={{ marginTop: 8 }} onClick={() => onStatusChange(order._id, "ready")}>Mark Ready</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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
                  <option value="picked">Picked</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

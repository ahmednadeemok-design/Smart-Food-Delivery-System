import formatCurrency from "../../utils/formatCurrency.js";
export default function OrderCard({ order, onAccept, onReject }) {
  return (
    <div className="card order-card">
      <div className="order-card-main">
        <div>
          <span className="badge">{order.emergencyMode ? "Emergency" : order.status}</span>
          <h3>{order.restaurantName}</h3>
          <p className="muted">Customer: {order.customerName}</p>
          <p><b>Pickup:</b> {order.pickup}</p>
          <p><b>Drop:</b> {order.dropoff}</p>
          <p className="muted">{order.items}</p>
        </div>
        <div className="order-card-side">
          <h3>{formatCurrency(order.amount)}</h3>
          <p><b>Earn:</b> {formatCurrency(order.earning || 0)}</p>
          <p className="muted">{order.distanceKm} km</p>
          <p className="muted">{String(order.paymentMethod || "cod").toUpperCase()} - {order.ageMinutes || 1} min old</p>
          {onAccept && <button className="btn" onClick={() => onAccept(order)}>Accept</button>}
          {onReject && <button className="btn outline" onClick={() => onReject(order)}>Skip</button>}
        </div>
      </div>
    </div>
  );
}

import formatCurrency from "../../utils/formatCurrency.js";
export default function OrderCard({ order, onAccept }) {
  return <div className="card"><div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><span className="badge">{order.emergencyMode ? "Emergency" : order.status}</span><h3>{order.restaurantName}</h3><p className="muted">Customer: {order.customerName}</p><p><b>Pickup:</b> {order.pickup}</p><p><b>Drop:</b> {order.dropoff}</p></div><div style={{textAlign:"right"}}><h3>{formatCurrency(order.amount)}</h3><p className="muted">{order.distanceKm} km</p>{onAccept && <button className="btn" onClick={() => onAccept(order)}>Accept</button>}</div></div></div>;
}

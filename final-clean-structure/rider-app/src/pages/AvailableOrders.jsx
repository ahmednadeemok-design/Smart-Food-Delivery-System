import { useState } from "react";
import OrderCard from "../components/rider/OrderCard.jsx";
import { mockAvailableOrders } from "../utils/mockData.js";
import { toast } from "../utils/toast.js";

export default function AvailableOrders() {
  const [orders, setOrders] = useState(mockAvailableOrders);
  const acceptOrder = (order) => { setOrders(prev => prev.filter(x => x._id !== order._id)); toast.success(`Accepted order ${order._id}`); };
  return <section className="page"><div className="container"><h1>Available Orders</h1><p className="muted">Nearby ready orders. Emergency orders get priority.</p><div className="grid">{orders.map(order => <OrderCard key={order._id} order={order} onAccept={acceptOrder}/>)}{orders.length===0 && <div className="card">No available orders right now.</div>}</div></div></section>;
}

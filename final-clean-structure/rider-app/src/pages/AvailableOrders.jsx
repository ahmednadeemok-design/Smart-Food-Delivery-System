import { useEffect, useState } from "react";
import OrderCard from "../components/rider/OrderCard.jsx";
import { acceptOrder, getAvailableOrders } from "../services/orderService.js";
import { mockAvailableOrders } from "../utils/mockData.js";
import { toast } from "../utils/toast.js";

const toCardOrder = (order) => ({
  _id: order._id,
  emergencyMode: order.emergencyMode,
  status: order.status,
  restaurantName: order.restaurant?.name || "Restaurant",
  customerName: order.customer?.name || "Customer",
  pickup: order.restaurant?.address || "Restaurant pickup",
  dropoff: order.deliveryAddress,
  amount: order.totalAmount,
  distanceKm: order.distanceKm || 3,
});

export default function AvailableOrders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await getAvailableOrders();
      const available = res.data.data || [];
      setOrders(available.length ? available.map(toCardOrder) : mockAvailableOrders);
    } catch (err) {
      toast.error(err.message);
      setOrders(mockAvailableOrders);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleAcceptOrder = async (order) => {
    try {
      await acceptOrder(order._id);
      setOrders((prev) => prev.filter((existing) => existing._id !== order._id));
      toast.success(`Accepted order ${order._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Available Orders</h1>
        <p className="muted">Nearby ready orders. Emergency orders get priority.</p>
        <div className="grid">
          {orders.map((order) => <OrderCard key={order._id} order={order} onAccept={handleAcceptOrder} />)}
          {orders.length === 0 && <div className="card">No available orders right now.</div>}
        </div>
      </div>
    </section>
  );
}

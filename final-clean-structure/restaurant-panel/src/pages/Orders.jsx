import { useEffect, useState } from "react";
import OrderTable from "../components/restaurant/OrderTable.jsx";
import { getRestaurantOrders, updateOrderStatus } from "../services/orderService.js";
import { toast } from "../utils/toast.js";

const toTableOrder = (order) => ({
  _id: order._id,
  customer: order.customer?.name || "Customer",
  phone: order.customer?.phone || "",
  address: order.deliveryAddress || "Narowal delivery address",
  rider: order.rider?.user?.name || "",
  items: order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "Items",
  amount: order.totalAmount,
  paymentMethod: (order.paymentMethod || "cod").toUpperCase(),
  status: order.status,
  priority: order.emergencyMode ? "Emergency" : "Normal",
  createdAt: order.createdAt,
});

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await getRestaurantOrders();
      const restaurantOrders = res.data.data || [];
      setOrders(restaurantOrders.map(toTableOrder));
    } catch (err) {
      toast.error(err.message);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 12000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, status) => {
    setOrders((prev) => prev.map((order) => order._id === orderId ? { ...order, status } : order));
    try {
      await updateOrderStatus(orderId, status);
      toast.success(`Order ${orderId} moved to ${status}`);
    } catch (err) {
      toast.error(err.message);
      loadOrders();
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Orders</h1>
        <p className="muted">Accept, prepare, mark ready, and reduce late delivery issues.</p>
        <OrderTable orders={orders} onStatusChange={updateStatus} />
      </div>
    </section>
  );
}

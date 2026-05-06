import { useEffect, useState } from "react";
import OrderTable from "../components/restaurant/OrderTable.jsx";
import { getRestaurantOrders, updateOrderStatus } from "../services/orderService.js";
import { mockOrders } from "../utils/mockData.js";
import { toast } from "../utils/toast.js";

const toTableOrder = (order) => ({
  _id: order._id,
  customer: order.customer?.name || "Customer",
  items: order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "Items",
  amount: order.totalAmount,
  status: order.status,
  priority: order.emergencyMode ? "Emergency" : "Normal",
});

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    try {
      const res = await getRestaurantOrders();
      const restaurantOrders = res.data.data || [];
      setOrders(restaurantOrders.length ? restaurantOrders.map(toTableOrder) : mockOrders);
    } catch (err) {
      toast.error(err.message);
      setOrders(mockOrders);
    }
  };

  useEffect(() => {
    loadOrders();
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

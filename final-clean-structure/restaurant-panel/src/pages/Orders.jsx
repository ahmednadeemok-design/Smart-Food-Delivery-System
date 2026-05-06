import { useState } from "react";
import OrderTable from "../components/restaurant/OrderTable.jsx";
import { mockOrders } from "../utils/mockData.js";
import { toast } from "../utils/toast.js";

export default function Orders() {
  const [orders, setOrders] = useState(mockOrders);

  const updateStatus = (orderId, status) => {
    setOrders((prev) => prev.map((order) => order._id === orderId ? { ...order, status } : order));
    toast.success(`Order ${orderId} moved to ${status}`);
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

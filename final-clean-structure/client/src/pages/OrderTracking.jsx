import { useEffect, useState } from "react";
import { getMyOrders, verifyDelivery } from "../services/orderService.js";
import socket from "../services/socket.js";
import formatCurrency from "../utils/formatCurrency.js";
import { toast } from "../utils/toast.js";

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);
  const [otp, setOtp] = useState("");

  const loadOrders = () => {
    getMyOrders().then((res) => setOrders(res.data.data)).catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    loadOrders();
    socket.connect();
    socket.on("order-status-updated", loadOrders);
    return () => {
      socket.off("order-status-updated", loadOrders);
      socket.disconnect();
    };
  }, []);

  const verify = async (orderId) => {
    try {
      await verifyDelivery(orderId, otp);
      toast.success("Delivery verified");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Order Tracking</h1>
        <div className="grid">
          {orders.map((order) => (
            <div className="card" key={order._id}>
              <span className="badge">{order.status}</span>
              <h3>Order #{order._id.slice(-6)}</h3>
              <p>Total: <b>{formatCurrency(order.totalAmount)}</b></p>
              <p>Freshness Score: {order.freshnessScore}%</p>
              <p>Estimated Delivery: {order.estimatedDeliveryTime} minutes</p>
              {order.status !== "delivered" && (
                <div style={{ display: "flex", gap: 10 }}>
                  <input className="input" placeholder="Enter Delivery OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  <button className="btn" onClick={() => verify(order._id)}>Verify</button>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="card">No orders yet.</div>}
        </div>
      </div>
    </section>
  );
}

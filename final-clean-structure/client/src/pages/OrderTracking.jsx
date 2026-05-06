import { useEffect, useState } from "react";
import { cancelOrder, getMyOrders, verifyDelivery } from "../services/orderService.js";
import socket from "../services/socket.js";
import formatCurrency from "../utils/formatCurrency.js";
import { toast } from "../utils/toast.js";
import { addToCart } from "../store/cartStore.js";
import SmartMap from "../components/map/SmartMap.jsx";

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

  const reorder = (order) => {
    order.items?.forEach((item) => {
      addToCart({
        _id: item.foodItem,
        restaurant: order.restaurant?._id || order.restaurant,
        name: item.name,
        price: item.price,
        calories: item.calories,
        quantity: item.quantity,
      });
    });
    toast.success("Order items added to cart");
  };

  const cancel = async (order) => {
    if (!window.confirm("Cancel this order before preparation starts?")) return;
    try {
      await cancelOrder(order._id, "Customer cancelled from order tracking");
      toast.success("Order cancelled");
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
              <p>Delivery Fee: {formatCurrency(order.deliveryFee || 0)} | Platform Fee: {formatCurrency(order.platformFee || 0)}</p>
              <SmartMap
                height={260}
                route
                points={[
                  { label: order.restaurant?.name || "Restaurant", lat: order.restaurant?.location?.lat || 32.1020, lng: order.restaurant?.location?.lng || 74.8740 },
                  { label: "Delivery location", lat: order.deliveryLocation?.lat || 32.1020, lng: order.deliveryLocation?.lng || 74.8740 },
                ]}
              />
              <div style={{ display: "grid", gap: 8, margin: "12px 0" }}>
                {(order.statusTimeline || []).filter((step) => step.status !== "seed").map((step) => (
                  <div key={`${order._id}-${step.status}-${step.at}`} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eef2f7", paddingBottom: 6 }}>
                    <span><b>{step.status}</b> {step.label}</span>
                    <span className="muted">{step.at ? new Date(step.at).toLocaleTimeString() : ""}</span>
                  </div>
                ))}
              </div>
              <button className="btn outline" onClick={() => reorder(order)}>Reorder</button>
              {["pending", "accepted"].includes(order.status) && (
                <button className="btn danger" onClick={() => cancel(order)} style={{ marginLeft: 8 }}>Cancel Order</button>
              )}
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

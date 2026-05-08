import { useEffect, useState } from "react";
import { cancelOrder, getMyOrders } from "../services/orderService.js";
import socket from "../services/socket.js";
import formatCurrency from "../utils/formatCurrency.js";
import { toast } from "../utils/toast.js";
import { addToCart } from "../store/cartStore.js";
import SmartMap from "../components/map/SmartMap.jsx";

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);

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
        <div className="section-head">
          <div>
            <span className="badge">Live orders</span>
            <h1>Order Tracking</h1>
          </div>
          <span className="muted">Realtime status and rider map</span>
        </div>
        <div className="grid">
          {orders.map((order) => (
            <div className="card tracking-card" key={order._id}>
              <div className="tracking-head">
                <div>
                  <span className="badge">{order.status}</span>
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p className="muted">{order.restaurant?.name || "Restaurant"} to {order.deliveryAddress}</p>
                </div>
                <div className="tracking-total">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="tracking-metrics">
                <span><b>{order.freshnessScore}%</b><small>Freshness</small></span>
                <span><b>{order.estimatedDeliveryTime || 35} min</b><small>ETA</small></span>
                <span><b>{formatCurrency(order.deliveryFee || 0)}</b><small>Delivery</small></span>
              </div>
              <SmartMap
                height={260}
                route
                points={[
                  { label: order.restaurant?.name || "Restaurant", lat: order.restaurant?.location?.lat || 32.1020, lng: order.restaurant?.location?.lng || 74.8740 },
                  order.rider?.currentLocation && { label: `Rider: ${order.rider?.user?.name || "Assigned rider"}`, lat: order.rider.currentLocation.lat, lng: order.rider.currentLocation.lng },
                  { label: "Delivery location", lat: order.deliveryLocation?.lat || 32.1020, lng: order.deliveryLocation?.lng || 74.8740 },
                ].filter(Boolean)}
              />
              <div className="timeline">
                {(order.statusTimeline || []).filter((step) => step.status !== "seed").map((step) => (
                  <div className="timeline-step" key={`${order._id}-${step.status}-${step.at}`}>
                    <span><b>{step.status}</b> {step.label}</span>
                    <span className="muted">{step.at ? new Date(step.at).toLocaleTimeString() : ""}</span>
                  </div>
                ))}
              </div>
              <button className="btn outline" onClick={() => reorder(order)}>Reorder</button>
              {["pending", "accepted"].includes(order.status) && (
                <button className="btn danger" onClick={() => cancel(order)} style={{ marginLeft: 8 }}>Cancel Order</button>
              )}
              {["assigned", "picked"].includes(order.status) && (
                <div className="otp-row">
                  <span className="badge">Delivery OTP: {order.otp}</span>
                  <span className="muted">Share this code with your assigned rider at delivery.</span>
                </div>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="empty-state"><h3>No orders yet</h3><p>Your active and past orders will appear here.</p></div>}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import { cancelOrder, getMyOrders, requestRefund } from "../services/orderService.js";
import socket from "../services/socket.js";
import formatCurrency from "../utils/formatCurrency.js";
import { toast } from "../utils/toast.js";
import { addToCart } from "../store/cartStore.js";
import SmartMap from "../components/map/SmartMap.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";

const OTP_STATUSES = ["ready", "assigned", "picked"];

const nextStepMessage = (order) => {
  const riderName = order.rider?.user?.name || "your rider";
  const messages = {
    pending: "Waiting for the restaurant to accept your order.",
    accepted: "Restaurant accepted your order and will start preparing soon.",
    preparing: "Restaurant is preparing your food.",
    ready: order.rider ? `${riderName} will pick up your order soon.` : "Your food is ready. A rider will be assigned shortly.",
    assigned: `${riderName} is heading to the restaurant for pickup.`,
    picked: `${riderName} is on the way to your delivery address.`,
    delivered: "Order delivered. You can request a refund if something was wrong.",
    cancelled: "This order was cancelled.",
    rejected: "The restaurant could not accept this order.",
  };
  return messages[order.status] || "We will keep this page updated as your order moves forward.";
};

export default function OrderTracking() {
  const [orders, setOrders] = useState([]);

  const loadOrders = () => {
    getMyOrders().then((res) => setOrders(res.data.data)).catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    loadOrders();
    const reload = (payload) => {
      if (payload?.status) toast.success(`Order ${payload.status}`);
      loadOrders();
    };
    socket.emit("join-role-rooms");
    socket.on("order-created", reload);
    socket.on("customer:order-placed", reload);
    socket.on("order-status-updated", reload);
    socket.on("customer:otp-visible", reload);
    socket.on("customer:rider-nearby", reload);
    socket.on("payment:refund-updated", reload);
    return () => {
      socket.off("order-created", reload);
      socket.off("customer:order-placed", reload);
      socket.off("order-status-updated", reload);
      socket.off("customer:otp-visible", reload);
      socket.off("customer:rider-nearby", reload);
      socket.off("payment:refund-updated", reload);
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

  const refund = async (order) => {
    const reason = window.prompt("Refund reason", "Issue with delivered order");
    if (!reason) return;
    try {
      await requestRefund(order._id, { reason, amount: order.totalAmount });
      toast.success("Refund request submitted for admin review");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const copyOtp = async (otp) => {
    try {
      await navigator.clipboard.writeText(String(otp));
      toast.success("Delivery OTP copied");
    } catch {
      toast.error("Copy failed. Please copy the OTP manually.");
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
            <div className="card tracking-card tracking-status-card" key={order._id}>
              <div className="tracking-head">
                <div>
                  <StatusBadge value={order.status} />
                  <h3>Order #{order._id.slice(-6)}</h3>
                  <p className="muted">{order.restaurant?.name || "Restaurant"} to {order.deliveryAddress}</p>
                </div>
                <div className="tracking-total">{formatCurrency(order.totalAmount)}</div>
              </div>
              <div className="next-step">{nextStepMessage(order)}</div>
              <div className="details-grid">
                <div className="detail-tile"><small>Restaurant</small><b>{order.restaurant?.name || "Restaurant"}</b></div>
                <div className="detail-tile"><small>Rider</small><b>{order.rider?.user?.name || "A rider will be assigned after the order is ready."}</b></div>
                <div className="detail-tile"><small>Delivery Address</small><b>{order.deliveryAddress || "Narowal delivery address"}</b></div>
                <div className="detail-tile"><small>Payment</small><b>{String(order.paymentMethod || "cod").toUpperCase()} / {order.paymentStatus || "pending"}</b></div>
              </div>
              <div className="tracking-metrics">
                <span><b>{order.freshnessScore}%</b><small>Freshness</small></span>
                <span><b>{order.estimatedDeliveryTime || 35} min</b><small>ETA</small></span>
                <span><b>{formatCurrency(order.deliveryFee || 0)}</b><small>Delivery</small></span>
                <span><b>{order.paymentStatus || "pending"}</b><small>Payment</small></span>
              </div>
              {OTP_STATUSES.includes(order.status) && order.otp && (
                <div className="otp-card">
                  <StatusBadge value="Delivery OTP" />
                  <h2>Delivery OTP</h2>
                  <p>Share this OTP with the rider only when you receive your order.</p>
                  <div className="otp-code">{order.otp}</div>
                  <button className="btn" onClick={() => copyOtp(order.otp)}>Copy OTP</button>
                </div>
              )}
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
                    <span><StatusBadge value={step.status} /> {step.label}</span>
                    <span className="muted">{step.at ? new Date(step.at).toLocaleTimeString() : ""}</span>
                  </div>
                ))}
              </div>
              <button className="btn outline" onClick={() => reorder(order)}>Reorder</button>
              {["pending", "accepted"].includes(order.status) && (
                <button className="btn danger" onClick={() => cancel(order)} style={{ marginLeft: 8 }}>Cancel Order</button>
              )}
              <div className="summary-row"><span>Payment method</span><b>{String(order.paymentMethod || "cod").toUpperCase()}</b></div>
              <div className="summary-row"><span>Refund status</span><b>{order.refundStatus || "none"}</b></div>
              {order.status === "delivered" && ["none", undefined].includes(order.refundStatus) && (
                <button className="btn outline" onClick={() => refund(order)} style={{ marginLeft: 8 }}>Request Refund</button>
              )}
            </div>
          ))}
          {orders.length === 0 && <div className="empty-state"><h3>No orders yet</h3><p>Your orders will appear here after checkout.</p></div>}
        </div>
      </div>
    </section>
  );
}

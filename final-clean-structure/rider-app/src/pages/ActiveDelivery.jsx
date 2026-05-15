import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import socket from "../services/socket.js";
import RouteMap from "../components/rider/RouteMap.jsx";
import { markPicked, verifyDelivery } from "../services/orderService.js";
import { getActiveOrder, updateRiderLocation } from "../services/riderService.js";
import { toast } from "../utils/toast.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import ContactActions from "../components/common/ContactActions.jsx";

const NAROWAL_CENTER = { lat: 32.1020, lng: 74.8740 };

const validPoint = (location) => {
  if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") return null;
  return location;
};

const routePointsFor = (order, location) => {
  if (!order) return [{ label: "Rider: Narowal", ...location }];
  const pickup = validPoint(order.restaurant?.location) || NAROWAL_CENTER;
  const drop = validPoint(order.deliveryLocation) || NAROWAL_CENTER;
  return [
    { label: "Rider", ...location },
    { label: `Pickup: ${order.restaurant?.name || "Restaurant"}`, ...pickup },
    { label: "Drop-off", ...drop },
  ];
};

const contactStatuses = ["assigned", "picked", "on-the-way"];

export default function ActiveDelivery() {
  const [location, setLocation] = useState({ lat: 32.1014, lng: 74.8730 });
  const [activeOrder, setActiveOrder] = useState(null);
  const [lastCompleted, setLastCompleted] = useState(null);
  const [otp, setOtp] = useState("");
  const canVerifyOtp = activeOrder?.status === "picked";
  const canMarkPicked = activeOrder?.status === "assigned";
  const canShowDeliveryContacts = contactStatuses.includes(activeOrder?.status);
  const completedOrder = lastCompleted && !activeOrder ? lastCompleted : null;

  const loadActiveOrder = async () => {
    try {
      const res = await getActiveOrder();
      const order = res.data.data || null;
      setActiveOrder(order);
      if (order) setLastCompleted(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadActiveOrder();
    socket.emit("join-role-rooms");
    const reload = (payload) => {
      if (payload?.ok) {
        setLastCompleted(payload.order || activeOrder);
        toast.success("Delivery completed. You are available for the next order.");
      }
      if (payload?.ok === false) toast.error(payload.message || "Wrong OTP. Ask the customer to read the 6-digit code again.");
      loadActiveOrder();
    };
    socket.on("rider:order-assigned", reload);
    socket.on("order-status-updated", reload);
    socket.on("rider:otp-verification-result", reload);
    const interval = setInterval(() => {
      if (!navigator.geolocation) {
        updateRiderLocation(location, true).catch(() => {});
        return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        socket.emit("rider-location-update", { riderId: "active-rider", location: next });
        updateRiderLocation(next, true).catch(() => {});
        setLocation(next);
      }, () => updateRiderLocation(location, true).catch(() => {}), { enableHighAccuracy: true, timeout: 6000 });
    }, 5000);
    return () => {
      clearInterval(interval);
      socket.off("rider:order-assigned", reload);
      socket.off("order-status-updated", reload);
      socket.off("rider:otp-verification-result", reload);
    };
  }, []);

  const moveStatus = async (status) => {
    if (!activeOrder) return toast.error("No active delivery");
    try {
      const res = status === "picked" ? await markPicked(activeOrder._id) : null;
      if (!res) return;
      setActiveOrder(res.data.data);
      toast.success(`Order marked as ${status}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const completeDelivery = async () => {
    if (!activeOrder) return toast.error("No active delivery");
    if (!canVerifyOtp) return toast.error("Mark the order as picked before verifying OTP.");
    if (!/^\d{6}$/.test(otp)) return toast.error("Enter the 6-digit customer OTP.");
    try {
      const res = await verifyDelivery(activeOrder._id, otp);
      setLastCompleted(res.data.data);
      setActiveOrder(null);
      setOtp("");
      toast.success("Delivery completed. You are available for the next order.");
    } catch (err) {
      toast.error(err.message?.includes("Invalid") ? "Wrong OTP. Ask the customer to read the 6-digit code again." : err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Active Delivery</h1>
        {completedOrder && (
          <div className="delivery-complete-card">
            <div className="delivery-complete-icon"><CheckCircle2 size={42} /></div>
            <StatusBadge value="Delivered" />
            <h2>Delivery Completed</h2>
            <p className="muted">Order #{completedOrder._id?.slice(-6)?.toUpperCase()} is complete. You are ready for the next Narowal delivery.</p>
            <div className="delivery-complete-grid">
              <div className="detail-tile"><small>Order ID</small><b>#{completedOrder._id?.slice(-6)?.toUpperCase()}</b></div>
              <div className="detail-tile"><small>Your Earning</small><b>Rs. {Number(completedOrder.riderEarning || 0).toLocaleString("en-PK")}</b></div>
              <div className="detail-tile"><small>Payment</small><b>{String(completedOrder.paymentMethod || "cod").toUpperCase()}</b><p className="muted">{completedOrder.paymentStatus || "cash_collected"}</p></div>
              <div className="detail-tile"><small>Completed At</small><b>{new Date(completedOrder.deliveredAt || completedOrder.updatedAt || Date.now()).toLocaleString()}</b></div>
            </div>
            <div className="delivery-complete-actions">
              <Link className="btn rider-primary-action" to="/available-orders">Back to Available Orders</Link>
              <Link className="btn outline rider-primary-action" to="/history">View Delivery History</Link>
            </div>
          </div>
        )}

        {!activeOrder && !completedOrder && (
          <div className="empty-state active-delivery-empty">
            <h2>No active delivery right now.</h2>
            <p>Accepted deliveries will appear here with pickup, drop-off, payment, and OTP actions.</p>
            <Link className="btn rider-primary-action" to="/available-orders">Find Available Orders</Link>
          </div>
        )}

        {activeOrder && <div className="grid grid-2">
          <div className="card rider-delivery-card">
            <StatusBadge value={activeOrder.status} />
            <h2>Order #{activeOrder._id.slice(-6)}</h2>
              <div className="delivery-detail-grid">
                <div className="detail-tile"><small>Pickup Location</small><b>{activeOrder.restaurant?.name || "Restaurant"}</b><p className="muted">{activeOrder.restaurant?.address || "Restaurant pickup"}</p></div>
                <div className="detail-tile"><small>Drop-off Location</small><b>{activeOrder.deliveryAddress}</b></div>
                <div className="detail-tile"><small>Payment</small><b>{String(activeOrder.paymentMethod || "cod").toUpperCase()}</b><p className="muted">{activeOrder.paymentMethod === "cod" ? `Collect Rs. ${Number(activeOrder.totalAmount || 0).toLocaleString("en-PK")}` : "Online paid"}</p></div>
                <div className="detail-tile"><small>Your Location</small><b>{Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)}</b></div>
                <div className="detail-tile"><small>OTP Instructions</small><b>{canVerifyOtp ? "Ask the customer for the 6-digit delivery OTP." : "Pick up the order first. OTP unlocks after pickup."}</b><p className="muted">Only enter OTP when the customer has received the food.</p></div>
              </div>
            {canShowDeliveryContacts && (
              <div className="contact-grid">
                <ContactActions
                  title={activeOrder.restaurant?.name || "Restaurant"}
                  subtitle="Pickup contact"
                  phone={activeOrder.restaurant?.supportContact || activeOrder.restaurant?.phone}
                  location={activeOrder.restaurant?.location}
                  address={activeOrder.restaurant?.address}
                />
                <ContactActions
                  title={activeOrder.customer?.name || "Customer"}
                  subtitle="Drop-off contact"
                  phone={activeOrder.customer?.phone}
                  location={activeOrder.deliveryLocation}
                  address={activeOrder.deliveryAddress}
                />
              </div>
            )}
            {canMarkPicked && <button className="btn rider-primary-action" onClick={() => moveStatus("picked")}>Mark Picked</button>}
            {["assigned", "picked"].includes(activeOrder?.status) && (
              <div className="otp-action">
                <input className="input" placeholder={canVerifyOtp ? "Customer OTP" : "OTP available after pickup"} value={otp} disabled={!canVerifyOtp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} />
                <button className="btn outline" disabled={!canVerifyOtp} onClick={completeDelivery}>Verify OTP</button>
              </div>
            )}
          </div>
          <RouteMap points={routePointsFor(activeOrder, location)} />
        </div>}
      </div>
    </section>
  );
}

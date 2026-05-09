import { useEffect, useState } from "react";
import socket from "../services/socket.js";
import RouteMap from "../components/rider/RouteMap.jsx";
import { markPicked, verifyDelivery } from "../services/orderService.js";
import { getActiveOrder, updateRiderLocation } from "../services/riderService.js";
import { toast } from "../utils/toast.js";
import StatusBadge from "../components/common/StatusBadge.jsx";

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

export default function ActiveDelivery() {
  const [location, setLocation] = useState({ lat: 32.1014, lng: 74.8730 });
  const [activeOrder, setActiveOrder] = useState(null);
  const [otp, setOtp] = useState("");

  const loadActiveOrder = async () => {
    try {
      const res = await getActiveOrder();
      setActiveOrder(res.data.data || null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadActiveOrder();
    socket.emit("join-role-rooms");
    const reload = (payload) => {
      if (payload?.ok) toast.success("OTP verified successfully");
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
    if (!/^\d{6}$/.test(otp)) return toast.error("Enter the 6-digit customer OTP.");
    try {
      const res = await verifyDelivery(activeOrder._id, otp);
      setActiveOrder(res.data.data);
      setOtp("");
      toast.success("Delivery completed.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Active Delivery</h1>
        <div className="grid grid-2">
          <div className="card rider-delivery-card">
            <StatusBadge value={activeOrder?.status || "No Active Order"} />
            <h2>{activeOrder ? `Order #${activeOrder._id.slice(-6)}` : "No active delivery"}</h2>
            {!activeOrder && <p className="muted">Accepted deliveries will appear here with pickup, drop-off, payment, and OTP actions.</p>}
            {activeOrder && (
              <div className="delivery-detail-grid">
                <div className="detail-tile"><small>Pickup Location</small><b>{activeOrder.restaurant?.name || "Restaurant"}</b><p className="muted">{activeOrder.restaurant?.address || "Restaurant pickup"}</p></div>
                <div className="detail-tile"><small>Drop-off Location</small><b>{activeOrder.deliveryAddress}</b></div>
                <div className="detail-tile"><small>Payment</small><b>{String(activeOrder.paymentMethod || "cod").toUpperCase()}</b><p className="muted">{activeOrder.paymentMethod === "cod" ? `Collect Rs. ${Number(activeOrder.totalAmount || 0).toLocaleString("en-PK")}` : "Online paid"}</p></div>
                <div className="detail-tile"><small>Your Location</small><b>{Number(location.lat).toFixed(4)}, {Number(location.lng).toFixed(4)}</b></div>
              </div>
            )}
            {activeOrder && <div className="action-row" style={{ marginBottom: 12 }}><button className="btn outline" type="button">Contact Restaurant</button><button className="btn outline" type="button">Contact Customer</button></div>}
            {activeOrder?.status === "assigned" && <button className="btn rider-primary-action" onClick={() => moveStatus("picked")}>Mark Picked</button>}
            {["assigned", "picked"].includes(activeOrder?.status) && (
              <div className="otp-action">
                <input className="input" placeholder="Customer OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button className="btn outline" onClick={completeDelivery}>Verify OTP</button>
              </div>
            )}
          </div>
          <RouteMap points={routePointsFor(activeOrder, location)} />
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from "react";
import socket from "../services/socket.js";
import RouteMap from "../components/rider/RouteMap.jsx";
import { getMyOrders, updateOrderStatus, verifyDelivery } from "../services/orderService.js";
import { updateRiderLocation } from "../services/riderService.js";
import { toast } from "../utils/toast.js";

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
      const res = await getMyOrders();
      const orders = res.data.data || [];
      setActiveOrder(orders.find((order) => !["delivered", "cancelled"].includes(order.status)) || null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    loadActiveOrder();
    socket.connect();
    const interval = setInterval(() => {
      setLocation((prev) => {
        const next = { lat: Number((prev.lat + 0.001).toFixed(4)), lng: Number((prev.lng + 0.001).toFixed(4)) };
        socket.emit("rider-location-update", { riderId: "active-rider", location: next });
        updateRiderLocation(next, true).catch(() => {});
        return next;
      });
    }, 5000);
    return () => { clearInterval(interval); socket.disconnect(); };
  }, []);

  const moveStatus = async (status) => {
    if (!activeOrder) return toast.error("No active delivery");
    try {
      const res = await updateOrderStatus(activeOrder._id, status);
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
          <div className="card">
            <span className="badge">{activeOrder?.status || "No Active Order"}</span>
            <h2>Current Location</h2>
            <p>Lat: {location.lat}</p>
            <p>Lng: {location.lng}</p>
            {activeOrder && <p>Order #{activeOrder._id.slice(-6)}</p>}
            {activeOrder?.restaurant && <p><b>Pickup:</b> {activeOrder.restaurant.name}, {activeOrder.restaurant.address}</p>}
            {activeOrder && <p><b>Drop:</b> {activeOrder.deliveryAddress}</p>}
            {activeOrder?.status === "assigned" && <button className="btn" onClick={() => moveStatus("picked")}>Confirm Pickup</button>}
            {["assigned", "picked"].includes(activeOrder?.status) && (
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <input className="input" placeholder="Customer OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button className="btn outline" onClick={completeDelivery}>Verify Delivery</button>
              </div>
            )}
          </div>
          <RouteMap points={routePointsFor(activeOrder, location)} />
        </div>
      </div>
    </section>
  );
}

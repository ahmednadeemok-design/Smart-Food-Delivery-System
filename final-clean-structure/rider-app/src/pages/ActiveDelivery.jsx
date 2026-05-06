import { useEffect, useState } from "react";
import socket from "../services/socket.js";
import RouteMap from "../components/rider/RouteMap.jsx";
import { getMyOrders, updateOrderStatus } from "../services/orderService.js";
import { toast } from "../utils/toast.js";

export default function ActiveDelivery() {
  const [location, setLocation] = useState({ lat: 32.1014, lng: 74.8730 });
  const [activeOrder, setActiveOrder] = useState(null);

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
            <button className="btn" onClick={() => moveStatus("picked")}>Confirm Pickup</button>{" "}
            <button className="btn outline" onClick={() => moveStatus("ready")}>Reached Restaurant</button>{" "}
            <button className="btn outline" onClick={() => toast.success("Go to OTP verification before completing delivery")}>Mark Delivered</button>
          </div>
          <RouteMap />
        </div>
      </div>
    </section>
  );
}

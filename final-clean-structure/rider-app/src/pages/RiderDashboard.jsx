import { useEffect, useState } from "react";
import StatCard from "../components/rider/StatCard.jsx";
import WorkloadMeter from "../components/rider/WorkloadMeter.jsx";
import RouteMap from "../components/rider/RouteMap.jsx";
import { updateRiderLocation } from "../services/riderService.js";
import { getMyOrders } from "../services/orderService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { getRiderTrustStatus } from "../features/riderTrustScore/trustScoreRules.js";
import { toast } from "../utils/toast.js";

export default function RiderDashboard() {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [activeOrders, setActiveOrders] = useState(0);
  const trustScore = user?.trustScore || 100;

  useEffect(() => {
    getMyOrders()
      .then((res) => setActiveOrders((res.data.data || []).filter((order) => !["delivered", "cancelled"].includes(order.status)).length))
      .catch(() => {});
  }, []);

  const setAvailability = async (nextOnline) => {
    try {
      await updateRiderLocation({ lat: 32.1014, lng: 74.8730 }, nextOnline);
      setOnline(nextOnline);
      toast.success(nextOnline ? "You are online now." : "You are offline now.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 18 }}>
          <span className="badge">{online ? "Online" : "Offline"}</span>
          <h1>Welcome, {user?.name || "Rider"}</h1>
          <p className="muted">Manage active deliveries, workload, optimized route, and OTP verification.</p>
          <button className="btn" onClick={() => setAvailability(!online)}>{online ? "Go Offline" : "Go Online"}</button>
        </div>
        <div className="grid grid-3">
          <StatCard title="Active Orders" value={activeOrders} subtitle="Current assigned deliveries" />
          <StatCard title="Trust Score" value={`${trustScore}%`} subtitle={getRiderTrustStatus(trustScore)} />
          <StatCard title="Today Earnings" value="Rs. 1,850" subtitle="Estimated rider payout" />
        </div>
        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <WorkloadMeter activeOrders={activeOrders} maxOrders={3} />
          <RouteMap />
        </div>
      </div>
    </section>
  );
}

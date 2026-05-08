import { useEffect, useState } from "react";
import StatCard from "../components/rider/StatCard.jsx";
import WorkloadMeter from "../components/rider/WorkloadMeter.jsx";
import RouteMap from "../components/rider/RouteMap.jsx";
import ProfileSetupCard from "../components/rider/ProfileSetupCard.jsx";
import { getMyRiderProfile, updateRiderAvailability } from "../services/riderService.js";
import { getMyOrders } from "../services/orderService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { getRiderTrustStatus } from "../features/riderTrustScore/trustScoreRules.js";
import { toast } from "../utils/toast.js";

export default function RiderDashboard() {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [activeOrders, setActiveOrders] = useState(0);
  const [profile, setProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const trustScore = profile?.trustScore || user?.trustScore || 100;

  const loadDashboard = () => {
    getMyRiderProfile()
      .then((res) => {
        const payload = res.data.data || {};
        setNeedsProfile(Boolean(payload.needsProfile));
        setProfile(payload.rider || null);
        setOnline(Boolean(payload.rider?.isOnline));
      })
      .catch((err) => toast.error(err.message));
    getMyOrders()
      .then((res) => setActiveOrders((res.data.data || []).filter((order) => !["delivered", "cancelled"].includes(order.status)).length))
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const setAvailability = async (nextOnline) => {
    if (needsProfile || !profile) {
      toast.error("Complete rider profile before going online.");
      return;
    }
    try {
      const res = await updateRiderAvailability(nextOnline, profile.currentLocation || { lat: 32.1014, lng: 74.8730 });
      setProfile(res.data.data);
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
          <span className="badge">{profile?.availabilityStatus || (online ? "online" : "offline")}</span>
          <h1>Welcome, {user?.name || "Rider"}</h1>
          <p className="muted">Manage active deliveries, workload, optimized route, and OTP verification.</p>
          <button className="btn" onClick={() => setAvailability(!online)}>{online ? "Go Offline" : "Go Online"}</button>
          {profile?.approvalStatus !== "approved" && <p className="muted">Your rider profile is pending admin approval.</p>}
        </div>
        {needsProfile && (
          <ProfileSetupCard
            onSaved={(rider) => {
              setProfile(rider);
              setNeedsProfile(false);
            }}
          />
        )}
        <div className="grid grid-3">
          <StatCard title="Active Orders" value={activeOrders} subtitle="Current assigned deliveries" />
          <StatCard title="Trust Score" value={`${trustScore}%`} subtitle={getRiderTrustStatus(trustScore)} />
          <StatCard title="Today Earnings" value={`Rs. ${Number(profile?.dailyEarnings || 0).toLocaleString("en-PK")}`} subtitle={`${profile?.completedDeliveries || 0} completed deliveries`} />
        </div>
        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <WorkloadMeter activeOrders={activeOrders} maxOrders={3} />
          <RouteMap />
        </div>
      </div>
    </section>
  );
}

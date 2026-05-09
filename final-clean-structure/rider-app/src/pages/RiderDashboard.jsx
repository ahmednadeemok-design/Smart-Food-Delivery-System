import { useEffect, useState } from "react";
import StatCard from "../components/rider/StatCard.jsx";
import WorkloadMeter from "../components/rider/WorkloadMeter.jsx";
import RouteMap from "../components/rider/RouteMap.jsx";
import ProfileSetupCard from "../components/rider/ProfileSetupCard.jsx";
import { getActiveOrder, getMyRiderProfile, getRiderEarnings, updateRiderAvailability, updateRiderLocation } from "../services/riderService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { getRiderTrustStatus } from "../features/riderTrustScore/trustScoreRules.js";
import { toast } from "../utils/toast.js";
import StatusBadge from "../components/common/StatusBadge.jsx";
import socket from "../services/socket.js";

export default function RiderDashboard() {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [earnings, setEarnings] = useState(null);
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
    getActiveOrder()
      .then((res) => setActiveOrder(res.data.data || null))
      .catch(() => {});
    getRiderEarnings()
      .then((res) => setEarnings(res.data.data || null))
      .catch(() => {});
  };

  useEffect(() => {
    loadDashboard();
    const reload = () => loadDashboard();
    socket.emit("join-role-rooms");
    socket.on("rider:availability-updated", reload);
    socket.on("rider:profile-updated", reload);
    socket.on("rider:order-assigned", reload);
    socket.on("order-status-updated", reload);
    const interval = setInterval(loadDashboard, 15000);
    return () => {
      clearInterval(interval);
      socket.off("rider:availability-updated", reload);
      socket.off("rider:profile-updated", reload);
      socket.off("rider:order-assigned", reload);
      socket.off("order-status-updated", reload);
    };
  }, []);

  useEffect(() => {
    if (!online || !navigator.geolocation) return undefined;
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateRiderLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }, true).catch(() => {}),
        () => updateRiderLocation(profile?.currentLocation || { lat: 32.1020, lng: 74.8740 }, true).catch(() => {}),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }, 20000);
    return () => clearInterval(interval);
  }, [online, profile?.currentLocation]);

  const setAvailability = async (nextOnline) => {
    if (needsProfile || !profile) {
      toast.error("Complete rider profile before going online.");
      return;
    }
    try {
      const location = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(profile.currentLocation || { lat: 32.1020, lng: 74.8740 });
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(profile.currentLocation || { lat: 32.1020, lng: 74.8740 }),
          { enableHighAccuracy: true, timeout: 6000 }
        );
      });
      const res = await updateRiderAvailability(nextOnline, location);
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
        <div className="card rider-hero" style={{ marginBottom: 18 }}>
          <div>
            <StatusBadge value={profile?.availabilityStatus || (online ? "online" : "offline")} />
            <h1>Welcome, {user?.name || "Rider"}</h1>
            <p className="muted">Go online to receive orders, then use Active Delivery for pickup and OTP completion.</p>
          </div>
          <button className={`btn rider-primary-action ${online ? "outline" : "success"}`} onClick={() => setAvailability(!online)}>
            {online ? "Go Offline" : "Go Online"}
          </button>
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
        {!needsProfile && profile?.approvalStatus === "pending" && <div className="card" style={{ marginBottom: 18 }}><span className="badge warning">Pending approval</span><h2>Waiting for admin approval</h2><p className="muted">Your profile is submitted. SmartFood Narowal operations will review CNIC, vehicle, and payout details.</p></div>}
        {!needsProfile && profile?.approvalStatus === "rejected" && <div className="card" style={{ marginBottom: 18 }}><span className="badge danger">Rejected</span><h2>Profile not approved</h2><p className="muted">Contact SmartFood support to correct your onboarding details.</p></div>}
        {!needsProfile && (profile?.isSuspended || profile?.approvalStatus === "suspended") && <div className="card" style={{ marginBottom: 18 }}><span className="badge danger">Suspended</span><h2>Rider account suspended</h2><p className="muted">{profile.suspensionReason || "Your account is temporarily suspended from deliveries."}</p></div>}
        <div className="grid grid-3">
          <StatCard title="Active Orders" value={activeOrder ? 1 : 0} subtitle={activeOrder ? `#${activeOrder._id.slice(-6)} ${activeOrder.status}` : "No assigned delivery"} />
          <StatCard title="Trust Score" value={`${trustScore}%`} subtitle={getRiderTrustStatus(trustScore)} />
          <StatCard title="Acceptance Rate" value={`${profile?.acceptanceRate ?? 100}%`} subtitle={`${profile?.cancellationRate ?? 0}% cancellation rate`} />
          <StatCard title="Today Earnings" value={`Rs. ${Number(earnings?.todayEarnings || profile?.dailyEarnings || 0).toLocaleString("en-PK")}`} subtitle={`${profile?.completedDeliveries || 0} completed deliveries`} />
          <StatCard title="COD Collected" value={`Rs. ${Number(earnings?.codCollectedToday || profile?.codCollectedToday || 0).toLocaleString("en-PK")}`} subtitle="Cash collected today" />
          <StatCard title="Pending Payout" value={`Rs. ${Number(earnings?.pendingPayout || profile?.pendingPayout || 0).toLocaleString("en-PK")}`} subtitle="Wallet awaiting payout" />
          <StatCard title="Weekly Earnings" value={`Rs. ${Number(earnings?.weeklyEarnings || profile?.weeklyEarnings || 0).toLocaleString("en-PK")}`} subtitle="Current payout week" />
          <StatCard title="Lifetime Earnings" value={`Rs. ${Number(earnings?.totalEarnings || profile?.totalLifetimeEarnings || 0).toLocaleString("en-PK")}`} subtitle="All completed deliveries" />
        </div>
        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <WorkloadMeter activeOrders={activeOrder ? 1 : 0} maxOrders={1} />
          <RouteMap points={activeOrder ? [
            { label: "Rider", ...(profile?.currentLocation || { lat: 32.1020, lng: 74.8740 }) },
            { label: `Pickup: ${activeOrder.restaurant?.name || "Restaurant"}`, ...(activeOrder.restaurant?.location || { lat: 32.1020, lng: 74.8740 }) },
            { label: "Drop-off", ...(activeOrder.deliveryLocation || { lat: 32.1020, lng: 74.8740 }) },
          ] : undefined} />
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import StatCard from "../components/rider/StatCard.jsx";
import WorkloadMeter from "../components/rider/WorkloadMeter.jsx";
import RouteMap from "../components/rider/RouteMap.jsx";
import { updateRiderLocation } from "../services/riderService.js";
import { useAuth } from "../store/AuthContext.jsx";
import { getRiderTrustStatus } from "../features/riderTrustScore/trustScoreRules.js";
import { toast } from "../utils/toast.js";

export default function RiderDashboard() {
  const { user } = useAuth();
  const [online, setOnline] = useState(false);

  const goOnline = async () => {
    try { await updateRiderLocation({ lat:32.101, lng:74.873 }); setOnline(true); toast.success("You are online now."); }
    catch (err) { toast.error(err.message); }
  };

  return <section className="page"><div className="container"><div className="card" style={{marginBottom:18}}><span className="badge">{online?"Online":"Offline"}</span><h1>Welcome, {user?.name || "Rider"}</h1><p className="muted">Manage active deliveries, workload, optimized route, and OTP verification.</p>{!online && <button className="btn" onClick={goOnline}>Go Online</button>}</div><div className="grid grid-3"><StatCard title="Active Orders" value="2" subtitle="Multi-order batch active"/><StatCard title="Trust Score" value="92%" subtitle={getRiderTrustStatus(92)}/><StatCard title="Today Earnings" value="Rs. 1,850" subtitle="Estimated rider payout"/></div><div className="grid grid-2" style={{marginTop:18}}><WorkloadMeter activeOrders={2} maxOrders={3}/><RouteMap/></div></div></section>;
}

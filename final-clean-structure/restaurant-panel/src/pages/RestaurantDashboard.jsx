import { useEffect, useState } from "react";
import StatCard from "../components/restaurant/StatCard.jsx";
import KitchenLoadMeter from "../components/restaurant/KitchenLoadMeter.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { getRestaurantDashboard, updateRestaurantOpenStatus } from "../services/restaurantService.js";
import { calculateKitchenLoad } from "../services/aiService.js";
import { toast } from "../utils/toast.js";
import formatCurrency from "../utils/formatCurrency.js";

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [aiLoad, setAiLoad] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const res = await getRestaurantDashboard();
        const data = res.data.data || {};
        setDashboard(data);
        setOrders(data.orders || []);
      } catch (err) {
        toast.error(err.message);
      }
    };
    loadDashboard();
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const stats = dashboard?.stats || {};
  const primaryRestaurant = dashboard?.restaurant;
  const approvalStatus = primaryRestaurant?.approvalStatus || dashboard?.approvalStatus;
  const activeOrders = stats.activeOrders ?? orders.filter((order) => !["delivered", "cancelled", "rejected"].includes(order.status)).length;

  useEffect(() => {
    if (!primaryRestaurant) return;
    calculateKitchenLoad({ activeOrders, averagePreparationTime: primaryRestaurant.averagePreparationTime || 20 })
      .then((res) => setAiLoad(res.data.data?.load || res.data.data?.details?.load || ""))
      .catch(() => setAiLoad(""));
  }, [activeOrders, primaryRestaurant?._id]);

  const toggleOpen = async () => {
    if (!primaryRestaurant) return;
    setBusy(true);
    try {
      const res = await updateRestaurantOpenStatus(!primaryRestaurant.isOpen);
      setDashboard((prev) => ({ ...prev, restaurant: res.data.data }));
      toast.success(res.data.message || "Restaurant status updated");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (dashboard?.onboardingRequired) {
    return (
      <section className="page">
        <div className="container">
          <div className="card">
            <span className="badge">Onboarding required</span>
            <h1>Complete your restaurant profile</h1>
            <p className="muted">Create your Narowal restaurant profile, business hours, payout details, and menu before going live.</p>
            <a className="btn" href="/menu">Start onboarding</a>
          </div>
        </div>
      </section>
    );
  }

  if (["pending", "pending_review", "rejected", "suspended"].includes(approvalStatus)) {
    const copy = {
      pending: "Your restaurant application is waiting for admin review.",
      pending_review: "Your restaurant application is waiting for admin review.",
      rejected: "Your restaurant application needs attention. Contact SmartFood support from the Support page.",
      suspended: "This restaurant is suspended and cannot accept orders.",
    };
    return (
      <section className="page">
        <div className="container">
          <div className="card">
            <span className="badge">{approvalStatus?.replace("_", " ")}</span>
            <h1>{primaryRestaurant?.name || `Welcome, ${user?.name || "Restaurant Owner"}`}</h1>
            <p className="muted">{copy[approvalStatus] || "Your restaurant is under review."}</p>
            <a className="btn outline" href="/support">Contact support</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div className="container">
        <div className="card" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <span className="badge">{primaryRestaurant?.isOpen === false ? "Closed" : "Open for Narowal orders"}</span>
            <h1>{primaryRestaurant?.name || `Welcome, ${user?.name || "Restaurant Owner"}`}</h1>
            <p className="muted">
              Manage orders, kitchen load, menu, sales, campaigns, and Narowal delivery operations.
            </p>
          </div>
          <button className={`btn ${primaryRestaurant?.isOpen ? "outline" : "success"}`} disabled={busy} onClick={toggleOpen}>
            {primaryRestaurant?.isOpen ? "Close restaurant" : "Open restaurant"}
          </button>
        </div>

        <div className="grid grid-3">
          <StatCard title="Active Orders" value={activeOrders} subtitle={`${stats.pendingOrders || 0} new, ${stats.readyOrders || 0} ready`} />
          <StatCard title="Today Sales" value={formatCurrency(stats.todaySales || 0)} subtitle={`${stats.weeklySales ? formatCurrency(stats.weeklySales) : "Rs. 0"} this week`} />
          <StatCard title="Trust Score" value={`${primaryRestaurant?.trustScore || 100}%`} subtitle="Restaurant accountability score" />
          <StatCard title="AI Kitchen Load" value={aiLoad || primaryRestaurant?.kitchenLoad || "low"} subtitle="Fallback-safe prediction" />
          <StatCard title="Pending Settlement" value={`Rs. ${Number(primaryRestaurant?.pendingSettlement || 0).toLocaleString("en-PK")}`} subtitle="Net payable to restaurant" />
          <StatCard title="Commission" value={`Rs. ${Number(primaryRestaurant?.platformCommission || 0).toLocaleString("en-PK")}`} subtitle={`${primaryRestaurant?.commissionRate || 15}% platform rule`} />
          <StatCard title="Avg Order" value={formatCurrency(stats.averageOrderValue || 0)} subtitle="Gross average order value" />
          <StatCard title="Support Issues" value={stats.supportIssues || 0} subtitle="Open partner tickets" />
          <StatCard title="Campaigns" value={stats.activeCampaigns || 0} subtitle="Active merchant offers" />
        </div>

        <div style={{ marginTop: 18 }}>
          <KitchenLoadMeter activeOrders={activeOrders} />
        </div>

        <div className="grid grid-2" style={{ marginTop: 18 }}>
          <div className="card">
            <h3>Popular Items</h3>
            {(stats.topItems || []).length === 0 ? <p className="muted">No item sales yet.</p> : (
              <div className="stack">
                {stats.topItems.map((item) => (
                  <div className="list-row" key={item._id}>
                    <span>{item.name}</span>
                    <b>{item.soldCount || 0} sold</b>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card">
            <h3>Latest Orders</h3>
            {orders.slice(0, 5).map((order) => (
              <div className="list-row" key={order._id}>
                <span>{order.customer?.name || "Customer"} - {order.status}</span>
                <b>{formatCurrency(order.totalAmount || 0)}</b>
              </div>
            ))}
            {orders.length === 0 && <p className="muted">New Narowal orders will appear here.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

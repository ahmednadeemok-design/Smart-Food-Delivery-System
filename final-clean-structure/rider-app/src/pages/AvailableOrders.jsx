import { useEffect, useState } from "react";
import OrderCard from "../components/rider/OrderCard.jsx";
import ProfileSetupCard from "../components/rider/ProfileSetupCard.jsx";
import RouteMap from "../components/rider/RouteMap.jsx";
import { acceptOrder, getAvailableOrders, rejectOrder } from "../services/orderService.js";
import { getMyRiderProfile } from "../services/riderService.js";
import { toast } from "../utils/toast.js";

const toCardOrder = (order) => ({
  _id: order._id,
  emergencyMode: order.emergencyMode,
  status: order.status,
  restaurantName: order.restaurant?.name || "Restaurant",
  customerName: order.customer?.name || "Customer",
  pickup: order.restaurant?.address || "Restaurant pickup",
  dropoff: order.deliveryAddress,
  amount: order.totalAmount,
  earning: order.riderEarning,
  paymentMethod: order.paymentMethod || "cod",
  ageMinutes: Math.max(1, Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000)),
  distanceKm: order.distanceKm || 3,
  items: order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "Order items",
  pickupLocation: order.restaurant?.location,
  dropLocation: order.deliveryLocation,
});

export default function AvailableOrders() {
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await getAvailableOrders();
      const available = res.data.data || [];
      setOrders(available.map(toCardOrder));
    } catch (err) {
      toast.error(err.message);
      setOrders([]);
    }
  };

  useEffect(() => {
    const loadProfileAndOrders = () => {
      getMyRiderProfile()
      .then((res) => {
        const payload = res.data.data || {};
        setProfile(payload.rider || null);
        setNeedsProfile(Boolean(payload.needsProfile));
      })
      .catch((err) => toast.error(err.message));
      loadOrders();
    };
    loadProfileAndOrders();
    const interval = setInterval(loadProfileAndOrders, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = async (order) => {
    if (needsProfile || !profile) {
      toast.error("Complete rider profile before accepting orders.");
      return;
    }
    if (!profile.isOnline) {
      toast.error("Go online from the rider dashboard before accepting orders.");
      return;
    }
    if (profile.approvalStatus !== "approved") {
      toast.error("Your rider profile needs admin approval first.");
      return;
    }
    try {
      await acceptOrder(order._id);
      setOrders((prev) => prev.filter((existing) => existing._id !== order._id));
      toast.success(`Accepted order ${order._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRejectOrder = async (order) => {
    try {
      await rejectOrder(order._id);
      setOrders((prev) => prev.filter((existing) => existing._id !== order._id));
      toast.success("Order skipped.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Available Orders</h1>
        <p className="muted">Nearby ready orders. Emergency orders get priority.</p>
        {needsProfile && (
          <ProfileSetupCard
            onSaved={(rider) => {
              setProfile(rider);
              setNeedsProfile(false);
            }}
          />
        )}
        {profile && profile.approvalStatus === "pending" && <div className="card" style={{ marginBottom: 18 }}><span className="badge warning">Pending approval</span><p className="muted">Admin approval is required before accepting orders.</p></div>}
        {profile && (profile.isSuspended || profile.approvalStatus === "suspended") && <div className="card" style={{ marginBottom: 18 }}><span className="badge danger">Suspended</span><p className="muted">Suspended riders cannot accept delivery jobs.</p></div>}
        {profile && !profile.isOnline && <div className="card" style={{ marginBottom: 18 }}>Go online from the rider dashboard to accept available orders.</div>}
        <div className="grid">
          {orders.map((order) => (
            <div className="grid grid-2" key={order._id}>
              <OrderCard order={order} onAccept={handleAcceptOrder} onReject={handleRejectOrder} />
              <RouteMap points={[
                { label: `Pickup: ${order.restaurantName}`, ...(order.pickupLocation || { lat: 32.1020, lng: 74.8740 }) },
                { label: "Drop-off", ...(order.dropLocation || { lat: 32.1020, lng: 74.8740 }) },
              ]} />
            </div>
          ))}
          {orders.length === 0 && <div className="card">No available orders right now.</div>}
        </div>
      </div>
    </section>
  );
}

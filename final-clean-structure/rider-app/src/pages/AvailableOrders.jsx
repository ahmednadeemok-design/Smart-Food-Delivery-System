import { useEffect, useState } from "react";
import OrderCard from "../components/rider/OrderCard.jsx";
import ProfileSetupCard from "../components/rider/ProfileSetupCard.jsx";
import { acceptOrder, getAvailableOrders } from "../services/orderService.js";
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
  distanceKm: order.distanceKm || 3,
  items: order.items?.map((item) => `${item.name} x${item.quantity}`).join(", ") || "Order items",
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
        {profile && !profile.isOnline && <div className="card" style={{ marginBottom: 18 }}>Go online from the rider dashboard to accept available orders.</div>}
        <div className="grid">
          {orders.map((order) => <OrderCard key={order._id} order={order} onAccept={handleAcceptOrder} />)}
          {orders.length === 0 && <div className="card">No available orders right now.</div>}
        </div>
      </div>
    </section>
  );
}

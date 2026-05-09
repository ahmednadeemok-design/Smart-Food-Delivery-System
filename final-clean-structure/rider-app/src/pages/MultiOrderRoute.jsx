import { useEffect, useMemo, useState } from "react";
import RouteMap from "../components/rider/RouteMap.jsx";
import StatusBadge from "../components/common/StatusBadge.jsx";
import { getActiveOrder, getMyRiderProfile } from "../services/riderService.js";
import socket from "../services/socket.js";
import { toast } from "../utils/toast.js";
import { NAROWAL_CENTER } from "../utils/location.js";

const demoStops = [
  { id: "demo-pickup", type: "Pickup", label: "Pickup preview", address: "Palmer Restaurant, Circular Road", eta: "8 min", location: { lat: 32.1020, lng: 74.8725 } },
  { id: "demo-drop", type: "Drop-off", label: "Drop-off preview", address: "UET Narowal Campus", eta: "16 min", location: { lat: 32.1135, lng: 74.8734 } },
];

const formatOrderRef = (order) => order?._id ? `#${String(order._id).slice(-6).toUpperCase()}` : "Order";

const locationFor = (value, fallback = NAROWAL_CENTER) => ({
  lat: Number(value?.lat ?? fallback.lat),
  lng: Number(value?.lng ?? fallback.lng),
});

const etaFor = (index) => `${Math.max(6, 8 + index * 9)} min`;

const stopFromOrder = (order, profileLocation) => {
  if (!order) return null;
  const isPicked = order.status === "picked";
  if (isPicked) {
    return {
      id: `${order._id}-drop`,
      type: "Drop-off",
      label: order.deliveryAddress || "Customer drop-off",
      address: order.deliveryAddress || "Narowal delivery address",
      eta: etaFor(0),
      order,
      location: locationFor(order.deliveryLocation),
      badge: "Drop-off",
    };
  }
  return {
    id: `${order._id}-pickup`,
    type: "Pickup",
    label: order.restaurant?.name || "Restaurant pickup",
    address: order.restaurant?.address || "Restaurant pickup address",
    eta: etaFor(0),
    order,
    location: locationFor(order.restaurant?.location),
    badge: "Pickup",
    riderLocation: profileLocation,
  };
};

const queuedStopsFromProfile = (profile, activeOrderId) => {
  const orders = profile?.activeOrders || [];
  return orders
    .filter((order) => String(order?._id) !== String(activeOrderId))
    .flatMap((order, index) => [
      {
        id: `${order._id}-queued-pickup`,
        type: "Pickup",
        label: order.restaurant?.name || "Restaurant pickup",
        address: order.restaurant?.address || "Restaurant pickup address",
        eta: etaFor(index + 1),
        order,
        location: locationFor(order.restaurant?.location),
        badge: "Pickup",
      },
      {
        id: `${order._id}-queued-drop`,
        type: "Drop-off",
        label: order.deliveryAddress || "Customer drop-off",
        address: order.deliveryAddress || "Narowal delivery address",
        eta: etaFor(index + 2),
        order,
        location: locationFor(order.deliveryLocation),
        badge: "Drop-off",
      },
    ]);
};

export default function MultiOrderRoute() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRoute = async () => {
    try {
      const [activeRes, profileRes] = await Promise.all([getActiveOrder(), getMyRiderProfile()]);
      setActiveOrder(activeRes.data.data || null);
      setProfile(profileRes.data.data?.rider || null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoute();
    const reload = () => loadRoute();
    socket.emit("join-role-rooms");
    socket.on("rider:order-assigned", reload);
    socket.on("order-status-updated", reload);
    socket.on("rider:availability-updated", reload);
    const interval = setInterval(loadRoute, 15000);
    return () => {
      clearInterval(interval);
      socket.off("rider:order-assigned", reload);
      socket.off("order-status-updated", reload);
      socket.off("rider:availability-updated", reload);
    };
  }, []);

  const riderLocation = locationFor(profile?.currentLocation);
  const currentStop = stopFromOrder(activeOrder, riderLocation);
  const queuedStops = queuedStopsFromProfile(profile, activeOrder?._id);
  const nextStop = queuedStops[0] || null;
  const hasRealRoute = Boolean(currentStop);
  const visibleStops = hasRealRoute ? [currentStop, ...queuedStops] : demoStops;

  const mapPoints = useMemo(() => {
    const points = [{ label: "1. Rider location", ...riderLocation }];
    visibleStops.forEach((stop, index) => {
      points.push({ label: `${index + 2}. ${stop.type}: ${stop.label}`, ...locationFor(stop.location) });
    });
    return points;
  }, [riderLocation, visibleStops]);

  return (
    <section className="page">
      <div className="container">
        <div className="section-head">
          <div>
            <StatusBadge value={hasRealRoute ? "Current" : "Demo optimization preview"} />
            <h1>Next Stops & Route</h1>
            <p className="muted">See your current delivery route and next stops.</p>
          </div>
        </div>

        <div className="grid grid-2">
          <div className="grid">
            <div className="card route-stop-card">
              <StatusBadge value="Current" />
              <h2>Current Stop</h2>
              {loading && <p className="muted">Loading route...</p>}
              {!loading && currentStop && (
                <>
                  <div className="route-stop-head">
                    <StatusBadge value={currentStop.badge} />
                    <b>{formatOrderRef(currentStop.order)}</b>
                  </div>
                  <h3>{currentStop.label}</h3>
                  <p className="muted">{currentStop.address}</p>
                  <p><b>Status:</b> <StatusBadge value={currentStop.order.status} /></p>
                  <p><b>ETA:</b> {currentStop.eta}</p>
                </>
              )}
              {!loading && !currentStop && (
                <div className="empty-state">
                  <h3>No active delivery</h3>
                  <p>No next stop yet. New ready orders will appear when assigned.</p>
                </div>
              )}
            </div>

            <div className="card route-stop-card">
              <StatusBadge value="Next" />
              <h2>Next Stop</h2>
              {nextStop ? (
                <>
                  <div className="route-stop-head">
                    <StatusBadge value={nextStop.badge} />
                    <b>{formatOrderRef(nextStop.order)}</b>
                  </div>
                  <h3>{nextStop.label}</h3>
                  <p className="muted">{nextStop.address}</p>
                  <p><b>ETA:</b> {nextStop.eta}</p>
                </>
              ) : (
                <p className="muted">No next stop yet. New ready orders will appear when assigned.</p>
              )}
            </div>

            <div className="card route-stop-card">
              <h2>Upcoming Stops</h2>
              {queuedStops.length > 0 ? (
                <div className="grid">
                  {queuedStops.map((stop, index) => (
                    <div className="detail-tile" key={stop.id}>
                      <small>{index + 1}. {stop.type}</small>
                      <b>{stop.label}</b>
                      <p className="muted">{formatOrderRef(stop.order)} / ETA {stop.eta}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No next stop yet. New ready orders will appear when assigned.</p>
              )}
            </div>

            {!hasRealRoute && (
              <div className="card">
                <StatusBadge value="Demo optimization preview" />
                <p className="muted">This preview shows how pickup and drop-off order will look once a real delivery is assigned.</p>
              </div>
            )}
          </div>

          <RouteMap points={mapPoints} title="Route Map" description="Rider location, pickup, drop-off, and next stop markers." />
        </div>
      </div>
    </section>
  );
}

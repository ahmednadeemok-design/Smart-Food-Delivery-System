import SmartMap from "./SmartMap.jsx";

export default function HeatMapPlaceholder() {
  // approximate coordinates for demo
  const zones = [
    { label: "Main Bazaar demand", lat: 32.1008, lng: 74.8712 },
    { label: "UET Narowal Campus", lat: 32.1135, lng: 74.8734 },
    { label: "Railway Road", lat: 32.0990, lng: 74.8678 },
    { label: "DHQ Hospital area", lat: 32.1058, lng: 74.8792 },
  ];

  return (
    <div className="card">
      <h3>Narowal Live Heat Map</h3>
      <p className="muted">
        Default center: Narowal city center (32.1020, 74.8740). High-demand zones include Main Bazaar,
        Circular Road, Railway Road, DHQ Hospital area, and UET Narowal.
      </p>
      <SmartMap points={zones} height={300} />
    </div>
  );
}

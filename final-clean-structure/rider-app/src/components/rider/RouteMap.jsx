import { MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

// approximate coordinates for demo
const DEFAULT_ROUTE = [
  { label: "Pickup: Palmer Restaurant", lat: 32.1020, lng: 74.8725 },
  { label: "Drop-off: UET Narowal Campus", lat: 32.1135, lng: 74.8734 },
  { label: "Backup stop: Railway Station", lat: 32.0992, lng: 74.8669 },
];

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function RouteMap({ points = DEFAULT_ROUTE }) {
  const center = points[0] || { lat: 32.1020, lng: 74.8740 };
  const positions = points.map((point) => [point.lat, point.lng]);

  return (
    <div className="card">
      <h3>Narowal Live Route</h3>
      <p className="muted">Pickup, drop-off, and route line for Narowal deliveries.</p>
      <div className="route-line">
        {points.map((point, index) => <span className="badge" key={point.label}>{index + 1}. {point.label}</span>)}
      </div>
      <div className="smart-map">
        <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom={false} style={{ minHeight: 320, width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {points.map((point) => (
            <Marker key={point.label} position={[point.lat, point.lng]} icon={icon}>
              <Popup>{point.label}</Popup>
            </Marker>
          ))}
          <Polyline positions={positions} pathOptions={{ color: "#0f766e", weight: 5 }} />
        </MapContainer>
      </div>
    </div>
  );
}

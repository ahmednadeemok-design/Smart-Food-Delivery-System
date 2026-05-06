import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

// approximate coordinates for demo
const CENTER = { lat: 32.1020, lng: 74.8740 };

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function AdminMap({ points = [] }) {
  const safePoints = points.length ? points : [{ label: "Narowal City Center", ...CENTER }];

  return (
    <div className="admin-map">
      <MapContainer center={[CENTER.lat, CENTER.lng]} zoom={13} scrollWheelZoom={false} style={{ minHeight: 330, width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {safePoints.map((point, index) => (
          <Marker key={`${point.label}-${index}`} position={[Number(point.lat), Number(point.lng)]} icon={icon}>
            <Popup>{point.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

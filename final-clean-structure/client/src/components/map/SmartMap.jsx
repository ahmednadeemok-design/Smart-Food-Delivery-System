import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { NAROWAL_CENTER, normalizeLocation, validateCoordinates } from "../../utils/location.js";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationPicker({ onPick }) {
  useMapEvents({
    click(event) {
      onPick?.({ lat: Number(event.latlng.lat.toFixed(5)), lng: Number(event.latlng.lng.toFixed(5)) });
    },
  });
  return null;
}

export default function SmartMap({ points = [], route = false, onPick, height = 320 }) {
  const usablePoints = points
    .filter((point) => validateCoordinates(point))
    .map((point) => ({ ...point, ...normalizeLocation(point) }));
  const center = usablePoints[0] || NAROWAL_CENTER;
  const positions = usablePoints.map((point) => [Number(point.lat), Number(point.lng)]);

  return (
    <div className="smart-map" style={{ minHeight: height }}>
      <MapContainer center={[center.lat, center.lng]} zoom={14} scrollWheelZoom={false} style={{ minHeight: height, width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {onPick && <LocationPicker onPick={onPick} />}
        {usablePoints.map((point, index) => (
          <Marker key={`${point.label}-${index}`} position={[Number(point.lat), Number(point.lng)]} icon={icon}>
            <Popup>{point.label}</Popup>
          </Marker>
        ))}
        {route && positions.length > 1 && <Polyline positions={positions} pathOptions={{ color: "#ff5a1f", weight: 5 }} />}
      </MapContainer>
    </div>
  );
}

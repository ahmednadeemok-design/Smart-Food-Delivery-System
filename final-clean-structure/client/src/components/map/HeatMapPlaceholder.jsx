export default function HeatMapPlaceholder() {
  return (
    <div className="card">
      <h3>Live Heat Map</h3>
      <p className="muted">
        This module will show high-demand areas, fast delivery zones, and rider density using Google Maps or Mapbox.
      </p>
      <div style={{
        height: 260,
        borderRadius: 16,
        background: "radial-gradient(circle at 30% 30%, #fed7aa, transparent 30%), radial-gradient(circle at 70% 60%, #fdba74, transparent 28%), #fff7ed",
        border: "1px dashed var(--primary)"
      }} />
    </div>
  );
}

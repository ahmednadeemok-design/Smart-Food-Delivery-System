import { getKitchenLoad } from "../../features/kitchenLoadIndicator/loadRules.js";

export default function KitchenLoadMeter({ activeOrders = 0 }) {
  const load = getKitchenLoad(activeOrders);

  return (
    <div className="card">
      <span className="badge">Kitchen Load: {load.label}</span>
      <h2>{activeOrders} active orders</h2>
      <div className="progress-bg">
        <div className="progress-fill" style={{ width: `${load.percentage}%`, background: load.color }} />
      </div>
      <p className="muted">
        Low load means faster preparation. High load means expected delay.
      </p>
    </div>
  );
}

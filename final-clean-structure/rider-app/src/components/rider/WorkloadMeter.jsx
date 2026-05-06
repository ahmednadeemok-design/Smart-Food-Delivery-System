export default function WorkloadMeter({ activeOrders = 2, maxOrders = 3 }) {
  const percentage = Math.min(100, Math.round((activeOrders / maxOrders) * 100));
  return <div className="card"><h3>Workload Balancing</h3><p className="muted">Current batch capacity</p><div style={{height:14,background:"#e2e8f0",borderRadius:999,overflow:"hidden"}}><div style={{width:`${percentage}%`,height:"100%",background:"var(--primary)"}} /></div><p><b>{activeOrders}</b> / {maxOrders} active orders</p></div>;
}

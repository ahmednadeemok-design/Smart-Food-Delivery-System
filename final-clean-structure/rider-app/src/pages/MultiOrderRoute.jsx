import RouteMap from "../components/rider/RouteMap.jsx";
import { routeStops } from "../utils/mockData.js";
import { optimizeStops } from "../features/routeOptimization/routeOptimizer.js";

export default function MultiOrderRoute() {
  const optimized = optimizeStops(routeStops);
  return <section className="page"><div className="container"><h1>Multi-Order Optimized Route</h1><p className="muted">Route ordering demo for batching 2–3 orders.</p><div className="grid grid-2"><div className="card"><h3>Optimized Stops</h3><div className="grid">{optimized.map((stop,index)=><div className="card" key={stop.id}><span className="badge">Step {index+1} • {stop.type}</span><h3>{stop.label}</h3><p className="muted">ETA: {stop.eta}</p></div>)}</div></div><RouteMap/></div></div></section>;
}

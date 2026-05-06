import { useState } from "react";
import KitchenLoadMeter from "../components/restaurant/KitchenLoadMeter.jsx";
import { calculateKitchenLoad } from "../services/aiService.js";
import { toast } from "../utils/toast.js";

export default function KitchenLoad() {
  const [activeOrders, setActiveOrders] = useState(8);
  const [aiLoad, setAiLoad] = useState("");

  const runAI = async () => {
    try {
      const res = await calculateKitchenLoad({ activeOrders: Number(activeOrders) });
      setAiLoad(res.data.data.load);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Kitchen Load Indicator</h1>
        <p className="muted">
          This helps customers understand expected delay before placing an order.
        </p>

        <div className="grid grid-2">
          <div className="card form">
            <h3>Calculate Load</h3>
            <input className="input" type="number" value={activeOrders} onChange={(e) => setActiveOrders(e.target.value)} />
            <button className="btn" onClick={runAI}>Run Backend AI Rule</button>
            {aiLoad && <p>Backend result: <b>{aiLoad}</b></p>}
          </div>
          <KitchenLoadMeter activeOrders={Number(activeOrders)} />
        </div>
      </div>
    </section>
  );
}

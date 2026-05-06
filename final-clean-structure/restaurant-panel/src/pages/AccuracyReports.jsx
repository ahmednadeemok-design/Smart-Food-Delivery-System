import { useState } from "react";
import { predictOrderAccuracy } from "../features/orderAccuracyPrediction/accuracyPredictor.js";

export default function AccuracyReports() {
  const [wrongItemComplaints, setWrongItemComplaints] = useState(6);
  const [totalOrders, setTotalOrders] = useState(100);

  const accuracy = predictOrderAccuracy({
    wrongItemComplaints: Number(wrongItemComplaints),
    totalOrders: Number(totalOrders),
  });

  return (
    <section className="page">
      <div className="container">
        <h1>Order Accuracy Prediction</h1>
        <p className="muted">
          Predicts risk of wrong/missing items using previous complaints and order history.
        </p>

        <div className="grid grid-2">
          <div className="card form">
            <label>Wrong / Missing Item Complaints</label>
            <input className="input" type="number" value={wrongItemComplaints} onChange={(e) => setWrongItemComplaints(e.target.value)} />
            <label>Total Orders</label>
            <input className="input" type="number" value={totalOrders} onChange={(e) => setTotalOrders(e.target.value)} />
          </div>

          <div className="card">
            <span className="badge">Prediction</span>
            <h1>{accuracy}%</h1>
            <p className="muted">
              Higher accuracy means lower risk of wrong or missing item complaints.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

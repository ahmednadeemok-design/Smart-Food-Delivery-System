import { useState } from "react";
import { calculateRefundAmount } from "../features/refundEngine/refundRules.js";

export default function Refunds() {
  const [orderTotal, setOrderTotal] = useState(2000);
  const [decision, setDecision] = useState("partial_refund");

  const amount = calculateRefundAmount(Number(orderTotal), decision);

  return (
    <section className="page">
      <div className="container">
        <h1>Refund Engine</h1>
        <p className="muted">
          Decision support for full refund, partial refund, or no refund.
        </p>

        <div className="grid grid-2">
          <div className="card form">
            <label>Order Total</label>
            <input className="input" type="number" value={orderTotal} onChange={(e) => setOrderTotal(e.target.value)} />
            <label>AI/Admin Decision</label>
            <select value={decision} onChange={(e) => setDecision(e.target.value)}>
              <option value="none">No Refund</option>
              <option value="partial_refund">Partial Refund</option>
              <option value="full_refund">Full Refund</option>
            </select>
          </div>

          <div className="card">
            <span className="badge">Refund Amount</span>
            <h1>Rs. {amount}</h1>
            <p className="muted">Transparent refund calculation for complaint resolution.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

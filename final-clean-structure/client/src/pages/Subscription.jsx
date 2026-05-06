import { useEffect, useState } from "react";
import { createSubscription, getMySubscription } from "../services/subscriptionService.js";
import { toast } from "../utils/toast.js";

export default function Subscription() {
  const [subscription, setSubscription] = useState(null);

  const load = () => getMySubscription().then((res) => setSubscription(res.data.data)).catch(() => {});

  useEffect(() => { load(); }, []);

  const activate = async () => {
    try {
      await createSubscription({ plan: "monthly", price: 999 });
      toast.success("Subscription activated");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="card">
          <span className="badge">Business Feature</span>
          <h1>SmartFood Plus</h1>
          <p className="muted">Monthly plan with free delivery and special discounts.</p>
          {subscription ? (
            <p><b>Active plan:</b> {subscription.plan}</p>
          ) : (
            <button className="btn" onClick={activate}>Activate Rs. 999/month</button>
          )}
        </div>
      </div>
    </section>
  );
}

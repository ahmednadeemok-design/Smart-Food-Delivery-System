import { useEffect, useState } from "react";
import { createSupportTicket, getSupportTickets } from "../services/restaurantService.js";
import { toast } from "../utils/toast.js";
import ContactActions from "../components/common/ContactActions.jsx";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ type: "technical_issue", description: "", order: "" });

  const load = () =>
    getSupportTickets()
      .then((res) => setTickets(res.data.data || []))
      .catch((err) => toast.error(err.message));

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await createSupportTicket({ ...form, order: form.order || undefined });
      setForm({ type: "technical_issue", description: "", order: "" });
      toast.success("Support ticket created");
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Partner Support</h1>
        <p className="muted">Raise operational issues for menu, payout, orders, account, or technical support.</p>
        <div className="card" style={{ marginBottom: 16 }}>
          <ContactActions title="SmartFood Admin Support" subtitle="Partner operations" />
        </div>

        <div className="grid grid-2">
          <form className="card form" onSubmit={submit}>
            <h3>New Ticket</h3>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="order_issue">Order issue</option>
              <option value="menu_issue">Menu issue</option>
              <option value="payout_issue">Payout issue</option>
              <option value="technical_issue">Technical issue</option>
              <option value="account_issue">Account issue</option>
            </select>
            <input className="input" placeholder="Related order ID optional" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            <textarea rows="5" placeholder="Describe the issue for SmartFood operations" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <button className="btn">Create ticket</button>
          </form>

          <div className="card">
            <h3>Recent Tickets</h3>
            {tickets.length === 0 && <p className="muted">No support tickets yet.</p>}
            {tickets.map((ticket) => (
              <div className="campaign-card" key={ticket._id}>
                <span className="badge">{ticket.status?.replace("_", " ")}</span>
                <h3>{ticket.type?.replace("_", " ")}</h3>
                <p>{ticket.description}</p>
                {ticket.adminNote && <p className="muted">Admin note: {ticket.adminNote}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

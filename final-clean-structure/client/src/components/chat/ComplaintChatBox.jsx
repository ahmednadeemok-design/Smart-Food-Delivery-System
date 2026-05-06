import { useState } from "react";
import { createComplaint } from "../../services/complaintService.js";
import { toast } from "../../utils/toast.js";

export default function ComplaintChatBox() {
  const [form, setForm] = useState({ order: "", type: "late_delivery", description: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createComplaint(form);
      toast.success("Complaint submitted. AI resolver will review it.");
      setForm({ order: "", type: "late_delivery", description: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h3>Smart Complaint Resolver</h3>
      <input className="input" placeholder="Order ID" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        <option value="late_delivery">Late Delivery</option>
        <option value="missing_item">Missing Item</option>
        <option value="wrong_item">Wrong Item</option>
        <option value="bad_quality">Bad Quality</option>
        <option value="payment_issue">Payment Issue</option>
      </select>
      <textarea rows="4" placeholder="Explain your issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button className="btn" disabled={loading}>{loading ? "Submitting..." : "Submit Complaint"}</button>
    </form>
  );
}

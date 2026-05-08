import { useEffect, useState } from "react";
import { createComplaint } from "../../services/complaintService.js";
import { getMyOrders } from "../../services/orderService.js";
import { toast } from "../../utils/toast.js";

export default function ComplaintChatBox() {
  const [form, setForm] = useState({ order: "", type: "late_delivery", description: "" });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyOrders()
      .then((res) => {
        const userOrders = res.data.data || [];
        setOrders(userOrders);
        setForm((prev) => ({ ...prev, order: prev.order || userOrders[0]?._id || "" }));
      })
      .catch(() => setOrders([]));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.order) return toast.error("Choose an order for this complaint.");
    if (!form.description.trim()) return toast.error("Please explain your issue.");
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
      <select value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })}>
        <option value="">Choose order</option>
        {orders.map((order) => (
          <option key={order._id} value={order._id}>
            #{order._id.slice(-6)} - {order.restaurant?.name || "Restaurant"} - {order.status}
          </option>
        ))}
      </select>
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        <option value="late_delivery">Late Delivery</option>
        <option value="missing_item">Missing Item</option>
        <option value="wrong_item">Wrong Item</option>
        <option value="bad_quality">Bad Quality</option>
        <option value="payment_issue">Payment Issue</option>
      </select>
      <textarea rows="4" placeholder="Explain your issue" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button className="btn" disabled={loading}>{loading ? "Submitting..." : "Submit Complaint"}</button>
      {orders.length === 0 && <p className="muted">Your orders will appear here after checkout.</p>}
    </form>
  );
}

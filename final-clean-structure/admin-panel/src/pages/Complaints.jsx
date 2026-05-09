import { useEffect, useState } from "react";
import ComplaintCard from "../components/admin/ComplaintCard.jsx";
import { getAdminComplaints, updateAdminComplaint } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import socket from "../services/socket.js";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);

  const loadComplaints = () => {
    getAdminComplaints().then((res) => {
      setComplaints((res.data.data || []).map((c) => ({
          _id: c._id,
          type: c.type,
          customer: c.customer?.name || "Customer",
          restaurant: c.restaurant?.name || "Restaurant",
          customerId: c.customer?._id,
          orderId: c.order?._id,
          status: c.status,
          aiDecision: c.aiDecision,
          compensation: c.compensation,
        })));
    }).catch((err) => toast.error(err.message));
  };

  useEffect(() => {
    loadComplaints();
    const reload = () => loadComplaints();
    socket.emit("join-role-rooms");
    socket.on("admin:complaint-updated", reload);
    return () => socket.off("admin:complaint-updated", reload);
  }, []);

  const resolve = async (id, status) => {
    setComplaints((prev) => prev.map((c) => c._id === id ? { ...c, status } : c));
    try {
      await updateAdminComplaint(id, { status, reason: `Admin marked complaint ${status}` });
      toast.success(`Complaint ${status}`);
      loadComplaints();
    } catch {
      toast.error("Complaint update failed");
    }
  };

  const setCompensation = async (complaint) => {
    const compensation = Number(window.prompt("Compensation/refund amount in PKR", complaint.compensation || 0));
    if (!Number.isFinite(compensation)) return;
    try {
      await updateAdminComplaint(complaint._id, { compensation, aiDecision: compensation > 0 ? "admin_refund" : "no_refund", reason: "Admin set compensation" });
      toast.success("Compensation updated");
      loadComplaints();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const penalizeCustomer = async (complaint) => {
    if (!complaint.customerId) return toast.error("Customer id missing");
    try {
      await updateAdminComplaint(complaint._id, { penaltyTarget: "customer", penaltyTargetId: complaint.customerId, penaltyAmount: 5, reason: "Admin complaint trust penalty" });
      toast.success("Customer penalized");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Complaints</h1>
        <p className="muted">AI-assisted complaint resolution and compensation review.</p>
        <div className="grid grid-3">
          {complaints.map((complaint) => (
            <div className="card" key={complaint._id}>
              <ComplaintCard complaint={complaint} onResolve={resolve} />
              <div className="action-row" style={{ marginTop: 12 }}>
                <button className="btn success" onClick={() => resolve(complaint._id, "resolved")}>Resolve</button>
                <button className="btn outline" onClick={() => resolve(complaint._id, "rejected")}>Reject</button>
                <button className="btn outline" onClick={() => setCompensation(complaint)}>Set Refund</button>
                <button className="btn danger" onClick={() => penalizeCustomer(complaint)}>Penalize Customer</button>
              </div>
            </div>
          ))}
          {complaints.length === 0 && <div className="card">No complaints yet.</div>}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from "react";
import ComplaintCard from "../components/admin/ComplaintCard.jsx";
import { getAdminComplaints, updateAdminComplaint } from "../services/adminService.js";
import { toast } from "../utils/toast.js";
import socket from "../services/socket.js";
import ContactActions from "../components/common/ContactActions.jsx";
import ActionModal from "../components/common/ActionModal.jsx";

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [compensationEdit, setCompensationEdit] = useState(null);
  const [compensationValue, setCompensationValue] = useState("");
  const queuedContactRefresh = useRef(false);

  const loadComplaints = () => {
    getAdminComplaints().then((res) => {
      setComplaints((res.data.data || []).map((c) => ({
          _id: c._id,
          type: c.type,
          customer: c.customer?.name || "Customer",
          customerPhone: c.customer?.phone || "",
          restaurant: c.restaurant?.name || "Restaurant",
          restaurantPhone: c.restaurant?.supportContact || c.restaurant?.phone || "",
          rider: c.rider?.user?.name || "",
          riderPhone: c.rider?.user?.phone || "",
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
    const reload = () => {
      if (window.__SMARTFOOD_CONTACT_MODAL_OPEN) {
        queuedContactRefresh.current = true;
        return;
      }
      loadComplaints();
    };
    const flushQueuedRefresh = (event) => {
      if (!event.detail?.open && queuedContactRefresh.current) {
        queuedContactRefresh.current = false;
        loadComplaints();
      }
    };
    socket.emit("join-role-rooms");
    socket.on("admin:complaint-updated", reload);
    window.addEventListener("smartfood:contact-modal-state", flushQueuedRefresh);
    return () => {
      socket.off("admin:complaint-updated", reload);
      window.removeEventListener("smartfood:contact-modal-state", flushQueuedRefresh);
    };
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

  const setCompensation = async () => {
    if (!compensationEdit) return;
    const compensation = Number(compensationValue);
    if (!Number.isFinite(compensation)) return;
    try {
      await updateAdminComplaint(compensationEdit._id, { compensation, aiDecision: compensation > 0 ? "admin_refund" : "no_refund", reason: "Admin set compensation" });
      toast.success("Compensation updated");
      setCompensationEdit(null);
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
              <div className="contact-grid">
                <ContactActions compact title={complaint.customer} subtitle="Customer" phone={complaint.customerPhone} />
                <ContactActions compact title={complaint.restaurant} subtitle="Restaurant" phone={complaint.restaurantPhone} />
                {complaint.rider && <ContactActions compact title={complaint.rider} subtitle="Rider" phone={complaint.riderPhone} />}
              </div>
              <div className="action-row" style={{ marginTop: 12 }}>
                <button className="btn success" onClick={() => resolve(complaint._id, "resolved")}>Resolve</button>
                <button className="btn outline" onClick={() => resolve(complaint._id, "rejected")}>Reject</button>
                <button className="btn outline" onClick={() => { setCompensationEdit(complaint); setCompensationValue(String(complaint.compensation || 0)); }}>Set Refund</button>
                <button className="btn danger" onClick={() => penalizeCustomer(complaint)}>Penalize Customer</button>
              </div>
            </div>
          ))}
          {complaints.length === 0 && <div className="card">No complaints yet.</div>}
        </div>
        {compensationEdit && (
          <ActionModal
            title="Set complaint compensation"
            message={`Review compensation for ${compensationEdit.customer}'s complaint.`}
            inputType="number"
            inputLabel="Compensation/refund amount in PKR"
            inputPlaceholder="0"
            value={compensationValue}
            onValueChange={setCompensationValue}
            confirmLabel="Save Compensation"
            onCancel={() => setCompensationEdit(null)}
            onConfirm={setCompensation}
          />
        )}
      </div>
    </section>
  );
}

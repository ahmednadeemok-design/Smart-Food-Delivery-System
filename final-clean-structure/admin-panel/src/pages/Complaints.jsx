import { useEffect, useState } from "react";
import ComplaintCard from "../components/admin/ComplaintCard.jsx";
import { getComplaints, updateComplaintStatus } from "../services/complaintService.js";
import { mockComplaints } from "../utils/mockData.js";
import { toast } from "../utils/toast.js";

export default function Complaints() {
  const [complaints, setComplaints] = useState(mockComplaints);

  useEffect(() => {
    getComplaints().then((res) => {
      if (res.data.data?.length) {
        setComplaints(res.data.data.map((c) => ({
          _id: c._id,
          type: c.type,
          customer: c.customer?.name || "Customer",
          status: c.status,
          aiDecision: c.aiDecision,
          compensation: c.compensation,
        })));
      }
    }).catch(() => {});
  }, []);

  const resolve = async (id, status) => {
    setComplaints((prev) => prev.map((c) => c._id === id ? { ...c, status } : c));
    try {
      await updateComplaintStatus(id, { status });
      toast.success(`Complaint ${status}`);
    } catch {
      toast.success(`Complaint ${status} locally`);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <h1>Complaints</h1>
        <p className="muted">AI-assisted complaint resolution and compensation review.</p>
        <div className="grid grid-3">
          {complaints.map((complaint) => (
            <ComplaintCard key={complaint._id} complaint={complaint} onResolve={resolve} />
          ))}
        </div>
      </div>
    </section>
  );
}

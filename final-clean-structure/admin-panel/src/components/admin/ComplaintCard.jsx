import StatusBadge from "../common/StatusBadge.jsx";

export default function ComplaintCard({ complaint, onResolve }) {
  return (
    <div>
      <StatusBadge value={complaint.type} />
      <h3>Complaint #{complaint._id}</h3>
      <p>Customer: <b>{complaint.customer}</b></p>
      <p>Status: <StatusBadge value={complaint.status} /></p>
      <p>AI Decision: <b>{complaint.aiDecision?.replaceAll("_", " ")}</b></p>
      <p>Compensation: <b>Rs. {complaint.compensation}</b></p>
      <div className="action-row">
        <button className="btn success" onClick={() => onResolve(complaint._id, "resolved")}>Resolve</button>
        <button className="btn danger" onClick={() => onResolve(complaint._id, "rejected")}>Reject</button>
      </div>
    </div>
  );
}

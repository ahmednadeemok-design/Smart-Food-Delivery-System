export default function ComplaintCard({ complaint, onResolve }) {
  return (
    <div>
      <span className="badge">{complaint.type}</span>
      <h3>Complaint #{complaint._id}</h3>
      <p>Customer: <b>{complaint.customer}</b></p>
      <p>Status: <b>{complaint.status}</b></p>
      <p>AI Decision: <b>{complaint.aiDecision}</b></p>
      <p>Compensation: <b>Rs. {complaint.compensation}</b></p>
      <div className="action-row">
        <button className="btn success" onClick={() => onResolve(complaint._id, "resolved")}>Resolve</button>
        <button className="btn danger" onClick={() => onResolve(complaint._id, "rejected")}>Reject</button>
      </div>
    </div>
  );
}

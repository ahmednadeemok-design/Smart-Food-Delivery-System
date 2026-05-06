export default function ComplaintCard({ complaint, onResolve }) {
  return (
    <div className="card">
      <span className="badge">{complaint.type}</span>
      <h3>Complaint #{complaint._id}</h3>
      <p>Customer: <b>{complaint.customer}</b></p>
      <p>Status: <b>{complaint.status}</b></p>
      <p>AI Decision: <b>{complaint.aiDecision}</b></p>
      <p>Compensation: <b>Rs. {complaint.compensation}</b></p>
      <div style={{ display: "flex", gap: 10 }}>
        <button className="btn success" onClick={() => onResolve(complaint._id, "resolved")}>Resolve</button>
        <button className="btn danger" onClick={() => onResolve(complaint._id, "rejected")}>Reject</button>
      </div>
    </div>
  );
}

const STATUS_CLASS = {
  pending: "warning",
  pending_review: "warning",
  approved: "success",
  active: "success",
  online: "success",
  open: "success",
  closed: "danger",
  complete: "success",
  missing: "warning",
  documents_missing: "warning",
  submitted: "info",
  verified: "success",
  delivered: "success",
  accepted: "success",
  rejected: "danger",
  suspended: "danger",
  cancelled: "danger",
  canceled: "danger",
  preparing: "info",
  assigned: "info",
  picked: "info",
  ready: "info",
  medium: "warning",
  high: "danger",
  low: "success",
  hidden: "warning",
  available: "success",
  posted: "success",
  reserved: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
  paid: "success",
  adjusted: "warning",
  collected: "warning",
  reconciled: "success",
};

export default function StatusBadge({ value, children, className = "" }) {
  const raw = String(value || children || "status");
  const key = raw.toLowerCase().split(":").pop().trim().replace(/\s+/g, "_");
  const label = raw.replace(/_/g, " ");
  const tone = STATUS_CLASS[key] || "";

  return <span className={`badge ${tone} ${className}`.trim()}>{label}</span>;
}

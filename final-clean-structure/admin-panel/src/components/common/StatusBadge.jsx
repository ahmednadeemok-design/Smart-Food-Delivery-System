const STATUS_CLASS = {
  pending: "warning",
  pending_review: "warning",
  approved: "success",
  active: "success",
  online: "success",
  open: "success",
  delivered: "success",
  accepted: "success",
  rejected: "danger",
  suspended: "danger",
  cancelled: "danger",
  canceled: "danger",
  blocked: "danger",
  preparing: "info",
  assigned: "info",
  picked: "info",
  ready: "info",
  reviewing: "info",
  medium: "warning",
  high: "danger",
  low: "success",
  refunded: "warning",
  cash_collected: "success",
  posted: "success",
  reserved: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
  reconciled: "success",
  collected: "warning",
  complete: "success",
};

export default function StatusBadge({ value, children, className = "" }) {
  const raw = String(value || children || "status");
  const key = raw.toLowerCase().split(":").pop().trim().replace(/\s+/g, "_");
  const label = raw.replace(/_/g, " ");
  const tone = STATUS_CLASS[key] || "";

  return <span className={`badge ${tone} ${className}`.trim()}>{label}</span>;
}

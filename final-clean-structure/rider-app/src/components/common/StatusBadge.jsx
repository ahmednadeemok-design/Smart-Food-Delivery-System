const STATUS_CLASS = {
  pending: "warning",
  pending_approval: "warning",
  approved: "success",
  active: "success",
  online: "success",
  delivered: "success",
  accepted: "success",
  rejected: "danger",
  suspended: "danger",
  cancelled: "danger",
  preparing: "info",
  assigned: "info",
  picked: "info",
  ready: "info",
  busy: "info",
  offline: "warning",
  emergency: "danger",
  posted: "success",
  reserved: "info",
  processing: "info",
  completed: "success",
  failed: "danger",
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

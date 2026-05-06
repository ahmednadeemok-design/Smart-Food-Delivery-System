export default function ErrorMessage({ message }) {
  if (!message) return null;
  return <div className="card" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>{message}</div>;
}

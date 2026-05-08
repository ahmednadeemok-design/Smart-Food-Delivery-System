export default function Loading({ text = "Loading..." }) {
  return (
    <div className="card muted loading-card">
      <img src="/brand/favicon.svg" alt="" />
      <span>{text}</span>
    </div>
  );
}

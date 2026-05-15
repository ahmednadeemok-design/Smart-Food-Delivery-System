export default function Loading({ text = "Loading..." }) {
  return (
    <div className="card muted loading-card" role="status" aria-live="polite">
      <img src="/brand/favicon.svg" alt="" />
      <span>{text}</span>
      <div className="skeleton-lines" aria-hidden="true">
        <i />
        <i />
      </div>
    </div>
  );
}

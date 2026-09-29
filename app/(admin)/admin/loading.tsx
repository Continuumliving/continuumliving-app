export default function AdminLoading() {
  return (
    <div aria-busy="true" style={{ opacity: 0.6 }}>
      <div className="bo-eyebrow">— Loading</div>
      <div className="bo-title" style={{ color: "var(--stone)" }}>
        One moment…
      </div>
    </div>
  );
}

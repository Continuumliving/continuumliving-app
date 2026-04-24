export default function Loading() {
  return (
    <div className="screen">
      <div className="back" style={{ opacity: 0.35 }}>
        Back to schedule
      </div>
      <div
        className="detail-hero skeleton"
        style={{ marginTop: 8, padding: "28px 0" }}
      >
        <div
          className="skeleton-line"
          style={{ width: 100, height: 16, marginBottom: 16 }}
        />
        <div
          className="skeleton-line"
          style={{ width: "75%", height: 34, marginBottom: 8 }}
        />
        <div
          className="skeleton-line"
          style={{ width: "95%", height: 12, marginTop: 18 }}
        />
        <div className="skeleton-line" style={{ width: "85%", height: 12 }} />
        <div className="skeleton-line" style={{ width: "60%", height: 12 }} />
      </div>
      <div style={{ marginTop: 10 }}>
        {["Next session", "Time", "Duration", "Venue", "Coach", "Residence"].map(
          (label) => (
            <div key={label} className="spec-row">
              <span className="spec-label">{label}</span>
              <span
                className="skeleton-line"
                style={{ width: 120, height: 16, marginBottom: 0 }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

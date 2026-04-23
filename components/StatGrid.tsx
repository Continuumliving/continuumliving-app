export interface StatProps {
  value: number | string;
  label: string;
  tone: "terracotta" | "olive" | "warm";
  since?: string;
}

export function StatGrid({
  high,
  low,
}: {
  high: number;
  low: number;
}) {
  return (
    <div className="stat-grid">
      <div className="stat terracotta">
        <div className="stat-num">{high}</div>
        <div className="stat-label">High intensity</div>
      </div>
      <div className="stat olive">
        <div className="stat-num">{low}</div>
        <div className="stat-label">Low intensity</div>
      </div>
    </div>
  );
}

export function StatRow({
  value,
  label,
  since,
}: {
  value: number | string;
  label: string;
  since?: string;
}) {
  return (
    <div style={{ marginTop: 10 }}>
      <div className="stat warm stat-row">
        <div>
          <div className="stat-label">{label}</div>
          {since ? <div className="since">{since}</div> : null}
        </div>
        <div className="stat-num" style={{ fontSize: 42 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

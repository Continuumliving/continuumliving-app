import {
  SkeletonHero,
  SkeletonStatGrid,
  SkeletonStatRow,
} from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="screen">
      <SkeletonHero tone="ink" />
      <div className="section-lead">
        <div className="eyebrow">— Your activity</div>
      </div>
      <SkeletonStatGrid />
      <SkeletonStatRow />
      <div style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          — Session breakdown
        </div>
        {["High intensity completed", "Low intensity completed", "Events attended", "Total sessions"].map(
          (l) => (
            <div key={l} className="activity-row">
              <span className="activity-label">{l}</span>
              <span
                className="skeleton-line"
                style={{ width: 30, height: 18, marginBottom: 0 }}
              />
            </div>
          ),
        )}
      </div>
    </div>
  );
}

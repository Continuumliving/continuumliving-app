import { SkeletonHero, SkeletonSessionCard } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="screen">
      <SkeletonHero />
      <div className="filter-bar" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="pill"
            style={{ opacity: 0.4, pointerEvents: "none" }}
          >
            &nbsp;&nbsp;&nbsp;
          </span>
        ))}
      </div>
      {[0, 1, 2].map((day) => (
        <div key={day}>
          <div className="day-header">
            <h3 style={{ opacity: 0.35 }}>—</h3>
            <div className="date" style={{ opacity: 0.35 }}>—</div>
          </div>
          <SkeletonSessionCard intensity={day % 2 === 0 ? "high" : "low"} />
          <SkeletonSessionCard intensity={day % 2 === 0 ? "low" : "high"} />
        </div>
      ))}
    </div>
  );
}

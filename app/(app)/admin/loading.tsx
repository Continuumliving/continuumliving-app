import { SkeletonHero } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="screen">
      <div className="back" style={{ opacity: 0.35 }}>
        Back to account
      </div>
      <SkeletonHero />
      <div
        className="skeleton"
        style={{ padding: 18, marginBottom: 6, background: "var(--cream)" }}
      >
        <div className="skeleton-line" style={{ width: "60%", height: 16 }} />
        <div
          className="skeleton-line"
          style={{ width: "40%", height: 10, marginTop: 6 }}
        />
      </div>
      <div
        className="skeleton"
        style={{ padding: 18, marginBottom: 6, background: "var(--cream)" }}
      >
        <div className="skeleton-line" style={{ width: "65%", height: 16 }} />
        <div
          className="skeleton-line"
          style={{ width: "45%", height: 10, marginTop: 6 }}
        />
      </div>
    </div>
  );
}

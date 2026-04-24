import { SkeletonHero, SkeletonEventCard } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="screen">
      <SkeletonHero tone="warm" />
      <div style={{ marginTop: 20 }}>
        <SkeletonEventCard />
        <SkeletonEventCard />
        <SkeletonEventCard />
        <SkeletonEventCard />
      </div>
    </div>
  );
}

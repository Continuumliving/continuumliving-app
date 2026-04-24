import {
  SkeletonHero,
  SkeletonQuote,
  SkeletonStatGrid,
  SkeletonStatRow,
  SkeletonSection,
} from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="screen">
      <SkeletonHero />
      <SkeletonQuote />
      <div className="section-lead">
        <div className="eyebrow">— Your season so far</div>
      </div>
      <SkeletonStatGrid />
      <SkeletonStatRow />
      <SkeletonSection eyebrow="— Today's sessions" rows={2} />
      <SkeletonSection eyebrow="— Tomorrow" rows={2} />
    </div>
  );
}

export function PageSkeleton({ cards = 2 }: { cards?: number }) {
  return (
    <main className="oa oa-skel" aria-busy="true" aria-label="Loading">
      <div>
        <div className="sk" style={{ width: 90, height: 10 }} />
        <div className="sk" style={{ width: 180, height: 30, marginTop: 10 }} />
      </div>
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="oa-card sk-card" style={{ height: i === 0 ? 220 : 140 }} />
      ))}
    </main>
  );
}

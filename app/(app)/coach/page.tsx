export default function CoachPage() {
  return (
    <main className="oa">
      <div className="oa-card oa-coachcard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/coach.jpg" alt="Tomash Marko" />
        <div>
          <h2 className="oa-h2">Tomash Marko</h2>
          <div className="oa-sub" style={{ fontSize: 13, marginTop: 3 }}>Your coach · on site every week</div>
        </div>
      </div>
      <div className="oa-card oa-empty">
        <div className="oa-eyebrow">Direct line</div>
        <p>Private messaging with your coach opens here shortly. Ask for a 1:1 session, change your plan or share how you feel, and get a personal reply.</p>
      </div>
    </main>
  );
}

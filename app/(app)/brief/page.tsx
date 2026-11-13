"use client";

import { useBookings, useClasses, useProfile } from "@/lib/data-context";
import { madridDateOffsetISO, todayMadridISO } from "@/lib/dates";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

/** Monday of the current Madrid week, as an offset from today. */
function mondayOffset(): number {
  const iso = todayMadridISO();
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay(); // 0=Sun
  return -((wd + 6) % 7);
}

export default function BriefPage() {
  const profile = useProfile();
  const classes = useClasses();
  const bookings = useBookings();
  if (!profile) return null;

  const mon = mondayOffset();
  const week = Array.from({ length: 7 }, (_, i) => madridDateOffsetISO(mon + i));
  const byId = new Map(classes.map((c) => [c.id, c]));
  const mine = bookings.filter((b) => week.includes(b.session_date) && byId.has(b.class_id));
  const hi = mine.filter((b) => byId.get(b.class_id)!.intensity === "high").length;
  const lo = mine.length - hi;
  const balance = mine.length === 0 ? "—" : hi > 0 && lo > 0 && Math.abs(hi - lo) <= 2 ? "Ideal" : hi > lo ? "Push-heavy" : "Recovery-heavy";
  const load = week.map((iso) => {
    const day = mine.filter((b) => b.session_date === iso).map((b) => byId.get(b.class_id)!);
    const h = day.filter((c) => c.intensity === "high").length;
    const l = day.length - h;
    return { h, l };
  });
  const maxLoad = Math.max(1, ...load.map((x) => x.h * 2 + x.l));
  const joined = new Date(profile.joined_at);
  const weekNo = Math.max(1, Math.floor((Date.now() - joined.getTime()) / (7 * 864e5)) + 1);

  return (
    <main className="oa">
      <div>
        <div className="oa-eyebrow">Personal Health Brief</div>
        <h1 className="oa-h1">Week {weekNo}</h1>
        <div className="oa-sub" style={{ marginTop: 4 }}>Your week so far · written up by your coach on Sunday</div>
      </div>

      <article className="oa-card" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 16 }}>
          <div><div style={{ fontSize: 10.5, letterSpacing: ".14em", color: "var(--mute)" }}>SESSIONS</div><div style={{ fontFamily: "var(--serif)", fontSize: 32, marginTop: 4 }}>{mine.length}<small style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--mute)" }}> / 5</small></div></div>
          <div><div style={{ fontSize: 10.5, letterSpacing: ".14em", color: "var(--mute)" }}>HIGH · LOW</div><div style={{ fontFamily: "var(--serif)", fontSize: 32, marginTop: 4 }}>{hi}<small style={{ fontFamily: "var(--sans)", fontSize: 14, color: "var(--mute)" }}> · {lo}</small></div></div>
          <div><div style={{ fontSize: 10.5, letterSpacing: ".14em", color: "var(--mute)" }}>BALANCE</div><div style={{ fontFamily: "var(--serif)", fontSize: balance.length > 6 ? 20 : 30, marginTop: balance.length > 6 ? 10 : 4, lineHeight: 1.15 }}>{balance}</div></div>
        </div>
        <div>
          <div className="oa-eyebrow" style={{ color: "var(--mute)" }}>Training load by day</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 130, borderBottom: "1px solid var(--line)", marginTop: 14 }}>
            {load.map((x, i) => {
              const v = x.h * 2 + x.l;
              const pct = v === 0 ? 3 : Math.max(18, (v / maxLoad) * 100);
              return <div key={i} style={{ flex: 1, height: `${pct}%`, borderRadius: "4px 4px 0 0", background: v === 0 ? "var(--line)" : x.h > 0 ? "var(--gold)" : "var(--lo)" }} />;
            })}
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, letterSpacing: ".08em", color: "var(--mute)", marginTop: 6 }}>
            {DOW.map((d, i) => <span key={i} style={{ flex: 1, textAlign: "center" }}>{d}</span>)}
          </div>
        </div>
        <div style={{ background: "#f1ebdf", borderRadius: 16, padding: 16, display: "flex", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="oa-av" src="/img/coach.jpg" alt="" />
          <div>
            <div className="oa-eyebrow">Coach&rsquo;s note</div>
            <p style={{ margin: "6px 0 0", fontSize: 15, lineHeight: 1.5, color: "#34363c" }}>
              Your first full brief follows your intake and baseline tests: resting heart rate, recovery and next week&rsquo;s focus, written personally each Sunday.
            </p>
          </div>
        </div>
      </article>
    </main>
  );
}

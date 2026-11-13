"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useActions } from "@/components/oa/useActions";
import { useBookings, useClassCounts, useClasses } from "@/lib/data-context";
import { classCategory, classImage, countKey, nextSevenDays } from "@/lib/owners";

function nowHM(): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
}

export default function ClassesPage() {
  const classes = useClasses();
  const bookings = useBookings();
  const counts = useClassCounts();
  const { book, unbook, busy } = useActions();
  const days = useMemo(() => nextSevenDays(), []);
  const firstWithClasses = Math.max(0, days.findIndex((d) => classes.some((c) => c.day === d.weekday)));
  const [sel, setSel] = useState<number>(firstWithClasses);
  const day = days[sel];
  const list = classes.filter((c) => c.day === day.weekday).sort((a, b) => a.time.localeCompare(b.time));
  const isToday = sel === 0;
  const hm = nowHM();

  return (
    <main className="oa">
      <div>
        <div className="oa-eyebrow">This week</div>
        <h1 className="oa-h1">Classes</h1>
      </div>

      <div className="oa-days" role="group" aria-label="Choose a day">
        {days.map((d, i) => {
          const has = classes.some((c) => c.day === d.weekday);
          return (
            <button key={d.iso} className={`oa-day${has ? "" : " empty"}`} aria-pressed={i === sel} onClick={() => setSel(i)}>
              <div className="d">{d.short}</div>
              <div className="n">{d.date}</div>
            </button>
          );
        })}
      </div>

      <div className="oa-legend">
        <span><i style={{ background: "var(--gold)" }} />HIGH INTENSITY</span>
        <span><i style={{ background: "var(--lo)" }} />LOW INTENSITY</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {list.length === 0 && (
          <div className="oa-card oa-empty">
            <div className="oa-eyebrow">Rest day</div>
            <p>No group classes on this day. Ask your coach for a private session, or use the facilities at your own pace.</p>
          </div>
        )}
        {list.map((c) => {
          const booking = bookings.find((b) => b.class_id === c.id && b.session_date === day.iso);
          const taken = counts[countKey(c.id, day.iso)] ?? (booking ? 1 : 0);
          const left = Math.max(c.capacity - taken, 0);
          const past = isToday && c.time <= hm;
          const hi = c.intensity === "high";
          return (
            <article key={c.id} className="oa-card oa-cls">
              <div className="oa-ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={classImage(c)} alt="" />
                <span className={`oa-tag ${hi ? "hi" : "lo"}`}>{hi ? "HIGH" : "LOW"}</span>
              </div>
              <div className="oa-body">
                <div className="oa-row" style={{ alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="oa-meta">{c.time} · {c.venue} · <span className="h">{classCategory(c).toUpperCase()}</span></div>
                    <div className="oa-cname">{c.title}</div>
                  </div>
                  {booking ? (
                    <button className="oa-pill solid" onClick={() => unbook(booking.id)} disabled={busy === booking.id || past} aria-pressed="true">Booked ✓</button>
                  ) : (
                    <button className="oa-pill line" onClick={() => book(c.id, day.iso)} disabled={past || left === 0 || busy === c.id + day.iso}>
                      {past ? "Started" : left === 0 ? "Full" : busy === c.id + day.iso ? "…" : "Book"}
                    </button>
                  )}
                </div>
                <div className="oa-desc">{c.description}</div>
                <div>
                  <div className="oa-spots"><i style={{ width: `${Math.min(100, (taken / Math.max(c.capacity, 1)) * 100)}%` }} /></div>
                  <div className="oa-meta" style={{ marginTop: 6 }}>{left} of {c.capacity} places left · {c.duration_min} min · heart-rate monitored</div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Link href="/coach" className="oa-card oa-slim">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/gymv.jpg" alt="" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="oa-meta">On request · Studio or residence</div>
          <div style={{ fontSize: 17, fontWeight: 500, marginTop: 3 }}>Private 1:1 Session</div>
        </div>
        <span className="oa-pill line">Request</span>
      </Link>
    </main>
  );
}

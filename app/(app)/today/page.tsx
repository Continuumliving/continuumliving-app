"use client";

import Link from "next/link";
import { LogoMark } from "@/components/oa/Icons";
import {
  useBookings,
  useClassCounts,
  useClasses,
  useEventCounts,
  useEvents,
  useProfile,
  useRsvps,
} from "@/lib/data-context";
import { formatLongDate, greeting, todayMadridISO, madridDateOffsetISO } from "@/lib/dates";
import { classImage, countKey, eventWhen, initials } from "@/lib/owners";

const WEEK_TARGET = 5;

export default function HomePage() {
  const profile = useProfile();
  const classes = useClasses();
  const bookings = useBookings();
  const counts = useClassCounts();
  const events = useEvents();
  const eventCounts = useEventCounts();
  const rsvps = useRsvps();
  if (!profile) return null;

  const today = todayMadridISO();
  const weekEnd = madridDateOffsetISO(6);
  const byId = new Map(classes.map((c) => [c.id, c]));
  const upcoming = bookings
    .filter((b) => b.session_date >= today && byId.has(b.class_id))
    .map((b) => ({ b, c: byId.get(b.class_id)! }))
    .sort((x, y) => (x.b.session_date + x.c.time).localeCompare(y.b.session_date + y.c.time));
  const thisWeek = upcoming.filter((u) => u.b.session_date <= weekEnd).length;
  const next = upcoming[0];
  const ring = (Math.min(thisWeek, WEEK_TARGET) / WEEK_TARGET) * 113.1;

  const nextEvent = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const eventLeft = nextEvent ? nextEvent.capacity - (eventCounts[nextEvent.id] ?? 0) : 0;
  const going = nextEvent ? rsvps.some((r) => r.event_id === nextEvent.id) : false;

  return (
    <main className="oa">
      <div className="oa-head">
        <div>
          <div className="oa-sub">{formatLongDate(today)}</div>
          <h1 className="oa-h1">{greeting()}{profile.first_name ? `, ${profile.first_name}` : ""}</h1>
        </div>
        <Link href="/account" className="oa-me" aria-label="My account">{initials(profile.first_name, profile.last_name)}</Link>
      </div>

      {next ? (
        <Link href="/classes" className="oa-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={classImage(next.c)} alt="" />
          <div className="oa-shade" />
          <div className="txt">
            <div className="oa-eyebrow g">Next · {formatLongDate(next.b.session_date).split(" ").slice(0, 2).join(" ")} {next.c.time}</div>
            <div className="t">{next.c.title}</div>
            <div className="oa-row" style={{ marginTop: 10 }}>
              <span style={{ fontSize: 14, opacity: 0.85 }}>
                {next.c.venue} · {counts[countKey(next.c.id, next.b.session_date)] ?? 1} of {next.c.capacity} places
              </span>
              <span className="oa-pill gold">Booked ✓</span>
            </div>
          </div>
        </Link>
      ) : (
        <Link href="/classes" className="oa-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/gymv.jpg" alt="" />
          <div className="oa-shade" />
          <div className="txt">
            <div className="oa-eyebrow g">This week</div>
            <div className="t">Book your first session</div>
            <div className="oa-row" style={{ marginTop: 10 }}>
              <span style={{ fontSize: 14, opacity: 0.85 }}>{classes.length} coached classes a week</span>
              <span className="oa-pill gold">See classes</span>
            </div>
          </div>
        </Link>
      )}

      <div className="oa-duo">
        <div className="oa-card oa-stat">
          <div className="k">This week</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
            <svg viewBox="0 0 44 44" width="58" height="58" aria-hidden="true">
              <circle cx="22" cy="22" r="18" fill="none" stroke="#ece5d7" strokeWidth="5" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="#c09a55" strokeWidth="5" strokeDasharray={`${ring.toFixed(1)} 113.1`} strokeLinecap="round" transform="rotate(-90 22 22)" style={{ transition: "stroke-dasharray .5s" }} />
            </svg>
            <div>
              <div className="oa-big">{Math.min(thisWeek, 99)}<small>/{WEEK_TARGET}</small></div>
              <div className="oa-sub" style={{ fontSize: 12 }}>sessions booked</div>
            </div>
          </div>
        </div>
        <Link href="/brief" className="oa-card oa-stat oa-dark">
          <div className="k">Health brief</div>
          <div className="oa-big" style={{ marginTop: 12 }}>Weekly</div>
          <div style={{ fontSize: 12.5, color: "#cfcac0", marginTop: 4 }}>Written by your coach</div>
        </Link>
      </div>

      <Link href="/coach" className="oa-card oa-msg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="oa-av" src="/img/coach.jpg" alt="" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Tomash · Coach</div>
          <div className="oa-sub" style={{ fontSize: 13, marginTop: 2 }}>Questions, a private session, or a change of plan.</div>
        </div>
        <div className="oa-dot" />
      </Link>

      {nextEvent && (
        <Link href="/events" className="oa-card oa-dark oa-event-mini">
          <LogoMark className="oa-wm" />
          <div className="oa-eyebrow g" style={{ position: "relative" }}>Resident event · {eventWhen(nextEvent)}</div>
          <div style={{ fontSize: 19, fontWeight: 500, marginTop: 6, position: "relative" }}>{nextEvent.title}</div>
          <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2, position: "relative" }}>
            {going ? "You are going ✓" : `${Math.max(eventLeft, 0)} seats left`}
          </div>
        </Link>
      )}

      <div className="oa-footnote">Continuum Living · Private Residences</div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/oa/Icons";
import { SignOutButton } from "@/components/SignOutButton";
import { useActions } from "@/components/oa/useActions";
import { PushToggle } from "@/components/oa/PushToggle";
import { useBookings, useClasses, useProfile, useRsvps, useEvents } from "@/lib/data-context";
import { formatShortDate, todayMadridISO } from "@/lib/dates";
import { MONTH_SHORT } from "@/lib/format";
import { eventWhen, initials } from "@/lib/owners";
import { DEVELOPMENTS } from "@/lib/types";

export default function AccountPage() {
  const profile = useProfile();
  const bookings = useBookings();
  const classes = useClasses();
  const rsvps = useRsvps();
  const events = useEvents();
  const { unbook, unreserve, busy } = useActions();
  const [all, setAll] = useState(false);
  if (!profile) return null;

  const today = todayMadridISO();
  const byId = new Map(classes.map((c) => [c.id, c]));
  const withClass = bookings.filter((b) => byId.has(b.class_id)).map((b) => ({ b, c: byId.get(b.class_id)! }));
  const upcoming = withClass.filter((x) => x.b.session_date >= today).sort((x, y) => (x.b.session_date + x.c.time).localeCompare(y.b.session_date + y.c.time));
  const past = withClass.filter((x) => x.b.session_date < today && x.b.attended !== false).sort((x, y) => y.b.session_date.localeCompare(x.b.session_date));
  const month = today.slice(0, 7);
  const thisMonth = past.filter((x) => x.b.session_date.startsWith(month));
  const hiMonth = thisMonth.filter((x) => x.c.intensity === "high").length;
  const myEvents = events.filter((e) => e.date >= today && rsvps.some((r) => r.event_id === e.id));

  const joined = new Date(profile.joined_at);
  const since = `${MONTH_SHORT[joined.getUTCMonth()]} ${joined.getUTCFullYear()}`;
  const until = `${MONTH_SHORT[joined.getUTCMonth()]} ${joined.getUTCFullYear() + 1}`;
  const dev = DEVELOPMENTS[profile.development];
  const shown = all ? past : past.slice(0, 6);

  return (
    <main className="oa">
      <Link href="/today" className="oa-back">‹ Home</Link>
      <div className="oa-prof">
        <div className="oa-me" aria-hidden="true">{initials(profile.first_name, profile.last_name)}</div>
        <div style={{ minWidth: 0 }}>
          <h1 className="oa-h1" style={{ fontSize: 30 }}>{profile.first_name} {profile.last_name ? `${profile.last_name.charAt(0)}.` : ""}</h1>
          <div className="oa-sub" style={{ marginTop: 4 }}>{profile.unit_number && profile.unit_number !== "—" ? `Residence ${profile.unit_number} · ` : ""}{dev?.name ?? "Private Residences"}</div>
        </div>
      </div>

      <div className="oa-dark oa-member">
        <LogoMark className="oa-wm" />
        <div className="oa-eyebrow g" style={{ position: "relative" }}>Membership</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 25, marginTop: 8, position: "relative" }}>Continuum Longevity Programme</div>
        <div style={{ fontSize: 14, color: "#cfcac0", marginTop: 6, position: "relative" }}>Included with your residence</div>
        <div className="oa-row" style={{ marginTop: 16, position: "relative", fontSize: 13, color: "#cfcac0" }}>
          <span>Member since {since}</span><span style={{ color: "var(--gold)" }}>Valid until {until}</span>
        </div>
      </div>

      <div className="oa-grid4">
        <div className="oa-card oa-stat"><div className="k">Sessions</div><div className="oa-big" style={{ marginTop: 6 }}>{past.length}</div><div className="oa-sub" style={{ fontSize: 12 }}>since you joined</div></div>
        <div className="oa-card oa-stat"><div className="k">This month</div><div className="oa-big" style={{ marginTop: 6 }}>{thisMonth.length}</div><div className="oa-sub" style={{ fontSize: 12 }}>{hiMonth} high · {thisMonth.length - hiMonth} low</div></div>
        <div className="oa-card oa-stat"><div className="k">Upcoming</div><div className="oa-big" style={{ marginTop: 6 }}>{upcoming.length}</div><div className="oa-sub" style={{ fontSize: 12 }}>classes booked</div></div>
        <div className="oa-card oa-stat"><div className="k">Events</div><div className="oa-big" style={{ marginTop: 6 }}>{myEvents.length}</div><div className="oa-sub" style={{ fontSize: 12 }}>seats reserved</div></div>
      </div>

      <div className="oa-sec"><h2 className="oa-h2">Upcoming</h2><Link href="/classes" className="oa-sub">Book more ›</Link></div>
      <div className="oa-card oa-list">
        {upcoming.length === 0 && myEvents.length === 0 && <div className="oa-li"><span className="oa-sub">Nothing booked yet.</span></div>}
        {upcoming.map(({ b, c }) => (
          <div className="oa-li" key={b.id}>
            <span className="oa-ib" style={{ background: c.intensity === "high" ? "var(--gold)" : "var(--lo)" }} />
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{c.title}</div><div className="oa-meta">{formatShortDate(b.session_date)} · {c.time} · {c.venue}</div></div>
            <button className="oa-pill line" onClick={() => unbook(b.id)} disabled={busy === b.id}>Cancel</button>
          </div>
        ))}
        {myEvents.map((e) => {
          const r = rsvps.find((x) => x.event_id === e.id)!;
          return (
            <div className="oa-li" key={e.id}>
              <span className="oa-ib" style={{ background: "var(--navy)" }} />
              <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{e.title}</div><div className="oa-meta">{eventWhen(e)}</div></div>
              <button className="oa-pill line" onClick={() => unreserve(r.id)} disabled={busy === r.id}>Cancel</button>
            </div>
          );
        })}
      </div>

      {past.length > 0 && (
        <>
          <div className="oa-sec"><h2 className="oa-h2">Class history</h2><span className="oa-sub">{past.length} sessions</span></div>
          <div className="oa-card oa-list">
            {shown.map(({ b, c }) => (
              <div className="oa-li" key={b.id}>
                <span className="oa-ib" style={{ background: c.intensity === "high" ? "var(--gold)" : "var(--lo)" }} />
                <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 500 }}>{c.title}</div><div className="oa-meta">{formatShortDate(b.session_date)} · {c.venue}</div></div>
                <div className="oa-meta">{b.attended === true ? "✓ " : ""}{c.duration_min} min</div>
              </div>
            ))}
          </div>
          {past.length > 6 && <button className="oa-pill line" style={{ alignSelf: "center" }} onClick={() => setAll(!all)}>{all ? "Show fewer" : "Show all sessions"}</button>}
        </>
      )}

      <div className="oa-sec"><h2 className="oa-h2">Settings</h2></div>
      <div className="oa-card oa-list">
        <PushToggle profileId={profile.id} />
        <div className="oa-kv"><span>Email</span><span>{profile.email}</span></div>
        <a className="oa-kv" href="https://wa.me/34609019874" target="_blank" rel="noopener noreferrer"><span>Concierge</span><span>WhatsApp ›</span></a>
        <div className="oa-kv"><span>Language</span><span>English</span></div>
        {profile.role === "admin" && <Link className="oa-kv" href="/admin"><span>Coach & admin</span><span style={{ color: "var(--gold-d)" }}>Open admin panel ›</span></Link>}
      </div>
      <div style={{ alignSelf: "center", minWidth: 200 }}><SignOutButton /></div>
      <div className="oa-footnote">Continuum Living</div>
    </main>
  );
}

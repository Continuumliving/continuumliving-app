import Link from "next/link";
import { FillBar, PageHead } from "@/components/admin/AdminShell";
import { loadAdminData } from "@/lib/admin";
import { formatStamp, fullName } from "@/lib/admin-format";
import { formatShortDate, madridDateOffsetISO, todayMadridISO } from "@/lib/dates";
import type { ClassRow } from "@/lib/types";

export const dynamic = "force-dynamic";

function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export default async function AdminOverview() {
  const { profiles, classes, events, bookings, rsvps } = await loadAdminData();
  const today = todayMadridISO();
  const in7 = madridDateOffsetISO(6);
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const classById = new Map(classes.map((c) => [c.id, c]));
  const eventById = new Map(events.map((e) => [e.id, e]));

  // Residents joined in the last 30 days
  const cutoff30 = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const newResidents = profiles.filter((p) => new Date(p.joined_at).getTime() >= cutoff30).length;

  // Next 7 days of sessions (today + 6)
  const active = classes.filter((c) => c.active);
  const occurrences: Array<{ cls: ClassRow; date: string; taken: number }> = [];
  for (let off = 0; off < 7; off++) {
    const date = madridDateOffsetISO(off);
    const wd = weekdayOf(date);
    for (const cls of active.filter((c) => c.day === wd)) {
      const taken = bookings.filter((b) => b.class_id === cls.id && b.session_date === date).length;
      occurrences.push({ cls, date, taken });
    }
  }
  const weekTaken = occurrences.reduce((s, o) => s + o.taken, 0);
  const weekCapacity = occurrences.reduce((s, o) => s + o.cls.capacity, 0);
  const fillRate = weekCapacity > 0 ? Math.round((weekTaken / weekCapacity) * 100) : 0;

  // Upcoming events
  const upcomingEvents = events
    .filter((e) => e.date >= today)
    .map((e) => ({ event: e, taken: rsvps.filter((r) => r.event_id === e.id).length }));
  const upcomingRsvps = upcomingEvents.reduce((s, e) => s + e.taken, 0);

  // Recent activity feed
  type Activity = { at: string; key: string; text: React.ReactNode; tag: string };
  const activity: Activity[] = [
    ...profiles.map((p) => ({
      at: p.joined_at,
      key: `p-${p.id}`,
      tag: "Joined",
      text: (
        <>
          <Link href={`/admin/residents/${p.id}`}>{fullName(p)}</Link> joined
          {p.unit_number ? ` · unit ${p.unit_number}` : ""}
        </>
      ),
    })),
    ...bookings.map((b) => {
      const p = profileById.get(b.profile_id);
      const c = classById.get(b.class_id);
      return {
        at: b.created_at,
        key: `b-${b.id}`,
        tag: "Booked",
        text: (
          <>
            <Link href={`/admin/residents/${b.profile_id}`}>{fullName(p)}</Link> booked{" "}
            <Link href={`/admin/classes/${b.class_id}`}>{c?.title ?? "a class"}</Link> ·{" "}
            {formatShortDate(b.session_date)}
          </>
        ),
      };
    }),
    ...rsvps.map((r) => {
      const p = profileById.get(r.profile_id);
      const e = eventById.get(r.event_id);
      return {
        at: r.created_at,
        key: `r-${r.id}`,
        tag: "RSVP",
        text: (
          <>
            <Link href={`/admin/residents/${r.profile_id}`}>{fullName(p)}</Link> reserved{" "}
            <Link href={`/admin/events/${r.event_id}`}>{e?.title ?? "an event"}</Link>
          </>
        ),
      };
    }),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 14);

  return (
    <>
      <PageHead
        eyebrow="— Overview"
        title={
          <>
            The house, <em>today.</em>
          </>
        }
        sub={`${formatShortDate(today)} · a live read of residents, the programme and the calendar.`}
        actions={
          <>
            <Link href="/admin/classes/new" className="bo-btn">
              New class
            </Link>
            <Link href="/admin/events/new" className="bo-btn primary">
              New event
            </Link>
          </>
        }
      />

      <div className="bo-kpis">
        <Link href="/admin/residents" className="bo-kpi">
          <div className="bo-kpi-num">{profiles.length}</div>
          <div className="bo-kpi-label">Residents</div>
          <div className={`bo-kpi-note${newResidents ? " up" : ""}`}>
            {newResidents ? `+${newResidents} in the last 30 days` : "No new sign-ups this month"}
          </div>
        </Link>
        <Link href="/admin/bookings" className="bo-kpi">
          <div className="bo-kpi-num">{weekTaken}</div>
          <div className="bo-kpi-label">Bookings · next 7 days</div>
          <div className="bo-kpi-note">
            {formatShortDate(today)} – {formatShortDate(in7)}
          </div>
        </Link>
        <Link href="/admin/classes" className="bo-kpi">
          <div className="bo-kpi-num">{fillRate}%</div>
          <div className="bo-kpi-label">Programme fill</div>
          <div className="bo-kpi-note">
            {weekTaken} of {weekCapacity} spots this week
          </div>
        </Link>
        <Link href="/admin/events" className="bo-kpi">
          <div className="bo-kpi-num">{upcomingRsvps}</div>
          <div className="bo-kpi-label">Event RSVPs</div>
          <div className="bo-kpi-note">
            Across {upcomingEvents.length} upcoming {upcomingEvents.length === 1 ? "event" : "events"}
          </div>
        </Link>
      </div>

      <div className="bo-grid-side">
        <div>
          <section className="bo-panel">
            <div className="bo-panel-head">
              <h2 className="bo-panel-title">Next seven days</h2>
              <Link href="/admin/classes">Programme →</Link>
            </div>
            {occurrences.length === 0 ? (
              <div className="bo-empty">No active classes scheduled.</div>
            ) : (
              <ul className="bo-list">
                {occurrences.map(({ cls, date, taken }) => (
                  <li key={`${cls.id}-${date}`}>
                    <div className="when">
                      {date === today ? "Today" : formatShortDate(date)}
                      <br />
                      {cls.time}
                    </div>
                    <div className="what">
                      <Link href={`/admin/classes/${cls.id}?date=${date}`}>{cls.title}</Link>
                      <div className="meta">
                        {cls.venue} · {cls.coach}
                      </div>
                    </div>
                    <FillBar taken={taken} capacity={cls.capacity} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="bo-panel">
            <div className="bo-panel-head">
              <h2 className="bo-panel-title">Upcoming events</h2>
              <Link href="/admin/events">All events →</Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="bo-empty">
                Nothing on the calendar. <Link href="/admin/events/new">Add an event</Link>.
              </div>
            ) : (
              <ul className="bo-list">
                {upcomingEvents.map(({ event, taken }) => (
                  <li key={event.id}>
                    <div className="when">
                      {formatShortDate(event.date)}
                      <br />
                      {event.time}
                    </div>
                    <div className="what">
                      <Link href={`/admin/events/${event.id}`}>{event.title}</Link>
                      <div className="meta">{event.venue}</div>
                    </div>
                    <FillBar taken={taken} capacity={event.capacity} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Recent activity</h2>
          </div>
          {activity.length === 0 ? (
            <div className="bo-empty">No activity yet.</div>
          ) : (
            <ul className="bo-list">
              {activity.map((a) => (
                <li key={a.key} style={{ alignItems: "flex-start" }}>
                  <div className="what">
                    <div>{a.text}</div>
                    <div className="meta">{formatStamp(a.at)}</div>
                  </div>
                  <span className="bo-tag">{a.tag}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

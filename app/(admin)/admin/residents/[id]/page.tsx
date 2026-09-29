import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAdd, CancelBookingButton, RemoveRsvpButton } from "@/components/admin/AdminActions";
import { PageHead } from "@/components/admin/AdminShell";
import { ResidentEditor } from "@/components/admin/ResidentEditor";
import { loadAdminData } from "@/lib/admin";
import { addDaysISO, formatDay, formatStamp, fullName, initials } from "@/lib/admin-format";
import { getCurrentProfile } from "@/lib/auth-cache";
import { formatShortDate, nextOccurrenceISO, todayMadridISO } from "@/lib/dates";
import { DAY_NAMES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ResidentDetail({ params }: { params: { id: string } }) {
  const [{ profiles, classes, events, bookings, rsvps }, me] = await Promise.all([
    loadAdminData(),
    getCurrentProfile(),
  ]);
  const resident = profiles.find((p) => p.id === params.id);
  if (!resident) notFound();

  const today = todayMadridISO();
  const name = fullName(resident);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const eventById = new Map(events.map((e) => [e.id, e]));

  const mine = bookings.filter((b) => b.profile_id === resident.id);
  const upcoming = mine
    .filter((b) => b.session_date >= today)
    .sort((a, b) => a.session_date.localeCompare(b.session_date));
  const past = mine
    .filter((b) => b.session_date < today)
    .sort((a, b) => b.session_date.localeCompare(a.session_date));
  const myRsvps = rsvps
    .filter((r) => r.profile_id === resident.id)
    .map((r) => ({ r, e: eventById.get(r.event_id) }))
    .sort((a, b) => (a.e?.date ?? "").localeCompare(b.e?.date ?? ""));

  // Booking options: next 3 occurrences of every active class, minus ones already booked.
  const booked = new Set(mine.map((b) => `${b.class_id}|${b.session_date}`));
  const bookingOptions = classes
    .filter((c) => c.active)
    .flatMap((c) => {
      const first = nextOccurrenceISO(c.day, c.time);
      return [0, 7, 14].map((off) => {
        const date = addDaysISO(first, off);
        return { value: `${c.id}|${date}`, label: `${formatShortDate(date)} · ${c.time} · ${c.title}`, date, time: c.time };
      });
    })
    .filter((o) => !booked.has(o.value))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
    .map(({ value, label }) => ({ value, label }));

  const reserved = new Set(myRsvps.map((x) => x.r.event_id));
  const rsvpOptions = events
    .filter((e) => e.date >= today && !reserved.has(e.id))
    .map((e) => ({ value: e.id, label: `${formatShortDate(e.date)} · ${e.title}` }));

  return (
    <>
      <PageHead
        crumb={{ href: "/admin/residents", label: "Residents" }}
        eyebrow={resident.role === "admin" ? "— Resident · Admin" : "— Resident"}
        title={
          <span className="bo-profile">
            <span className="bo-avatar lg">{initials(resident)}</span>
            <span>{name}</span>
          </span>
        }
        sub={
          <>
            <a href={`mailto:${resident.email}`} style={{ color: "inherit" }}>
              {resident.email}
            </a>
            {resident.unit_number && resident.unit_number !== "—" ? ` · Unit ${resident.unit_number}` : ""} · Member
            since {formatDay(resident.joined_at)}
          </>
        }
      />

      <div className="bo-grid-side">
        <div>
          <section className="bo-panel">
            <div className="bo-stats3">
              <div>
                <div className="n">{upcoming.length}</div>
                <div className="l">Upcoming</div>
              </div>
              <div>
                <div className="n">{past.length}</div>
                <div className="l">Attended</div>
              </div>
              <div>
                <div className="n">{myRsvps.length}</div>
                <div className="l">Event RSVPs</div>
              </div>
            </div>
          </section>

          <section className="bo-panel">
            <div className="bo-panel-head">
              <h2 className="bo-panel-title">Upcoming classes</h2>
            </div>
            {upcoming.length === 0 ? (
              <div className="bo-empty">No upcoming bookings.</div>
            ) : (
              <ul className="bo-list">
                {upcoming.map((b) => {
                  const c = classById.get(b.class_id);
                  return (
                    <li key={b.id}>
                      <div className="when">
                        {formatShortDate(b.session_date)}
                        <br />
                        {c?.time}
                      </div>
                      <div className="what">
                        <Link href={`/admin/classes/${b.class_id}?date=${b.session_date}`}>
                          {c?.title ?? "Retired class"}
                        </Link>
                        <div className="meta">
                          {c ? `${c.venue} · ${c.coach}` : ""} · booked {formatStamp(b.created_at)}
                        </div>
                      </div>
                      <div className="right">
                        <CancelBookingButton booking={b} who={name} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="bo-panel-body" style={{ borderTop: "0.5px solid var(--hair)" }}>
              <AdminAdd
                kind="booking"
                fixed={{ profileId: resident.id }}
                options={bookingOptions}
                placeholder="Book into a class…"
                button="Book"
              />
            </div>
          </section>

          <section className="bo-panel">
            <div className="bo-panel-head">
              <h2 className="bo-panel-title">Events</h2>
            </div>
            {myRsvps.length === 0 ? (
              <div className="bo-empty">No event reservations.</div>
            ) : (
              <ul className="bo-list">
                {myRsvps.map(({ r, e }) => (
                  <li key={r.id}>
                    <div className="when">
                      {e ? formatShortDate(e.date) : "—"}
                      <br />
                      {e?.time}
                    </div>
                    <div className="what">
                      <Link href={`/admin/events/${r.event_id}`}>{e?.title ?? "Removed event"}</Link>
                      <div className="meta">{e?.venue}</div>
                    </div>
                    <div className="right">
                      {e && e.date < today ? (
                        <span className="bo-tag past">Past</span>
                      ) : (
                        <RemoveRsvpButton id={r.id} who={name} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {rsvpOptions.length ? (
              <div className="bo-panel-body" style={{ borderTop: "0.5px solid var(--hair)" }}>
                <AdminAdd
                  kind="rsvp"
                  fixed={{ profileId: resident.id }}
                  options={rsvpOptions}
                  placeholder="Reserve a place at…"
                  button="Reserve"
                />
              </div>
            ) : null}
          </section>

          <section className="bo-panel">
            <div className="bo-panel-head">
              <h2 className="bo-panel-title">Class history</h2>
            </div>
            {past.length === 0 ? (
              <div className="bo-empty">No past sessions yet.</div>
            ) : (
              <ul className="bo-list">
                {past.slice(0, 30).map((b) => {
                  const c = classById.get(b.class_id);
                  return (
                    <li key={b.id}>
                      <div className="when">{formatShortDate(b.session_date)}</div>
                      <div className="what">
                        {c?.title ?? "Retired class"}
                        <div className="meta">{c ? `${DAY_NAMES[c.day]} ${c.time} · ${c.coach}` : ""}</div>
                      </div>
                      {c ? <span className={`bo-tag ${c.intensity}`}>{c.intensity}</span> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Details</h2>
          </div>
          <div className="bo-panel-body">
            <ResidentEditor resident={resident} isSelf={me?.id === resident.id} />
          </div>
        </section>
      </div>
    </>
  );
}

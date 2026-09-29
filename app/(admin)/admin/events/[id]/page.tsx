import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAdd, ExportButton, RemoveRsvpButton } from "@/components/admin/AdminActions";
import { EventForm } from "@/components/admin/AdminForms";
import { FillBar, PageHead } from "@/components/admin/AdminShell";
import { loadAdminData } from "@/lib/admin";
import { formatStamp, fullName } from "@/lib/admin-format";
import { formatLongDate, todayMadridISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function EventDetail({ params }: { params: { id: string } }) {
  const { profiles, events, rsvps } = await loadAdminData();
  const event = events.find((e) => e.id === params.id);
  if (!event) notFound();

  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const guests = rsvps
    .filter((r) => r.event_id === event.id)
    .map((r) => ({ r, p: profileById.get(r.profile_id) }))
    .sort((a, b) => a.r.created_at.localeCompare(b.r.created_at));
  const guestIds = new Set(guests.map((g) => g.r.profile_id));
  const isPast = event.date < todayMadridISO();
  const full = guests.length >= event.capacity;

  const addOptions = profiles
    .filter((p) => !guestIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: `${fullName(p)}${p.unit_number && p.unit_number !== "—" ? ` · ${p.unit_number}` : ""}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <PageHead
        crumb={{ href: "/admin/events", label: "Events" }}
        eyebrow={`— ${event.kind} · ${formatLongDate(event.date)} · ${event.time}`}
        title={event.title}
        sub={`${event.venue} · ${event.host}`}
      />

      <div className="bo-grid-side">
        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Guest list</h2>
            <ExportButton
              filename={`guests-${event.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${event.date}.csv`}
              headers={["Guest", "Email", "Unit", "Reserved at"]}
              rows={guests.map(({ r, p }) => [fullName(p), p?.email ?? "", p?.unit_number ?? "", r.created_at])}
            />
          </div>
          <div className="bo-toolbar">
            <span className="bo-eyebrow">{isPast ? "Past event" : full ? "Fully reserved" : "Open for reservations"}</span>
            <span className="grow" />
            <FillBar taken={guests.length} capacity={event.capacity} />
          </div>
          {guests.length === 0 ? (
            <div className="bo-empty">No reservations yet.</div>
          ) : (
            <ul className="bo-list">
              {guests.map(({ r, p }, i) => (
                <li key={r.id}>
                  <div className="when">{i + 1}</div>
                  <div className="what">
                    <Link href={`/admin/residents/${r.profile_id}`}>{fullName(p)}</Link>
                    <div className="meta">
                      {p?.unit_number && p.unit_number !== "—" ? `Unit ${p.unit_number} · ` : ""}reserved{" "}
                      {formatStamp(r.created_at)}
                    </div>
                  </div>
                  <div className="right">{isPast ? null : <RemoveRsvpButton id={r.id} who={fullName(p)} />}</div>
                </li>
              ))}
            </ul>
          )}
          {!isPast ? (
            <div className="bo-panel-body" style={{ borderTop: "0.5px solid var(--hair)" }}>
              {full ? (
                <p style={{ fontSize: 12, color: "var(--stone-deep)" }}>
                  The event is at capacity. Raise the capacity to add more guests.
                </p>
              ) : (
                <AdminAdd
                  kind="rsvp"
                  fixed={{ eventId: event.id }}
                  options={addOptions}
                  placeholder="Add a resident to the guest list…"
                  button="Add guest"
                />
              )}
            </div>
          ) : null}
        </section>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Edit event</h2>
          </div>
          <div className="bo-panel-body">
            <EventForm initial={event} />
          </div>
        </section>
      </div>
    </>
  );
}

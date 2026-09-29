import Link from "next/link";
import { FillBar, PageHead } from "@/components/admin/AdminShell";
import { loadAdminData } from "@/lib/admin";
import { formatShortDate, todayMadridISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const { events, rsvps } = await loadAdminData();
  const today = todayMadridISO();
  const withCounts = events.map((e) => ({ e, taken: rsvps.filter((r) => r.event_id === e.id).length }));
  const upcoming = withCounts.filter((x) => x.e.date >= today);
  const past = withCounts.filter((x) => x.e.date < today).reverse();

  const table = (list: typeof withCounts, isPast: boolean) => (
    <div className="bo-table-wrap">
      <table className="bo-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Event</th>
            <th className="hide-sm">Type</th>
            <th className="hide-sm">Host</th>
            <th className="num">Guests</th>
          </tr>
        </thead>
        <tbody>
          {list.map(({ e, taken }) => (
            <tr key={e.id}>
              <td style={{ whiteSpace: "nowrap" }}>
                {formatShortDate(e.date)} · {e.time}
              </td>
              <td>
                <Link href={`/admin/events/${e.id}`}>{e.title}</Link>
                <div style={{ fontSize: 12, color: "var(--stone-deep)" }}>{e.venue}</div>
              </td>
              <td className="hide-sm">
                <span className="bo-tag">{e.kind}</span>
              </td>
              <td className="muted hide-sm">{e.host}</td>
              <td className="num">
                {isPast ? (
                  `${taken} / ${e.capacity}`
                ) : (
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <FillBar taken={taken} capacity={e.capacity} />
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <PageHead
        eyebrow="— Events"
        title={
          <>
            The seasonal <em>calendar.</em>
          </>
        }
        sub="Open an event to edit it, see the guest list, or add and remove guests."
        actions={
          <Link href="/admin/events/new" className="bo-btn primary">
            New event
          </Link>
        }
      />

      <section className="bo-panel">
        <div className="bo-panel-head">
          <h2 className="bo-panel-title">Upcoming · {upcoming.length}</h2>
        </div>
        {upcoming.length === 0 ? (
          <div className="bo-empty">
            Nothing scheduled. <Link href="/admin/events/new">Add an event</Link>.
          </div>
        ) : (
          table(upcoming, false)
        )}
      </section>

      {past.length ? (
        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Past · {past.length}</h2>
          </div>
          {table(past, true)}
        </section>
      ) : null}
    </>
  );
}

import Link from "next/link";
import { getRequestClient } from "@/lib/auth-cache";
import { todayMadridISO } from "@/lib/dates";
import { eventImage, eventWhen } from "@/lib/owners";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const sb = getRequestClient();
  const [{ data, error }, rs] = await Promise.all([
    sb.from("events").select("*").order("date", { ascending: true }),
    sb.from("event_rsvps").select("event_id"),
  ]);
  if (error) throw error;
  const events = (data ?? []) as EventRow[];
  const counts = new Map<string, number>();
  for (const r of rs.data ?? []) counts.set(r.event_id as string, (counts.get(r.event_id as string) ?? 0) + 1);
  const today = todayMadridISO();
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today).reverse();

  const row = (e: EventRow) => (
    <Link key={e.id} href={`/admin/events/${e.id}`} className="oa-li">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img loading="lazy" decoding="async" src={eventImage(e)} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{e.title}</div>
        <div className="oa-meta">{eventWhen(e)} · {e.venue}</div>
      </div>
      <span className="oa-status">{counts.get(e.id) ?? 0}/{e.capacity}</span>
    </Link>
  );

  return (
    <main className="oa">
      <Link href="/admin" className="oa-back">‹ Admin</Link>
      <div className="oa-head">
        <div>
          <div className="oa-eyebrow">Calendar</div>
          <h1 className="oa-h1">Events</h1>
          <div className="oa-sub" style={{ marginTop: 4 }}>{upcoming.length} upcoming</div>
        </div>
        <Link href="/admin/events/new" className="oa-pill gold">+ New event</Link>
      </div>
      {upcoming.length === 0 ? <div className="oa-card oa-empty"><p>No upcoming events.</p></div> : <div className="oa-card oa-list">{upcoming.map(row)}</div>}
      {past.length > 0 && (
        <>
          <div className="oa-eyebrow" style={{ color: "var(--mute)", marginTop: 10 }}>Past</div>
          <div className="oa-card oa-list" style={{ opacity: 0.75 }}>{past.slice(0, 10).map(row)}</div>
        </>
      )}
    </main>
  );
}

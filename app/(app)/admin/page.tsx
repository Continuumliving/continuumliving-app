import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";
import { isAdmin } from "@/lib/profile";
import { madridDateOffsetISO, todayMadridISO } from "@/lib/dates";
import { thisMonthStart } from "@/lib/brief";

export const dynamic = "force-dynamic";

interface P { id: string; first_name: string; last_name: string; email: string; unit_number: string; role: string; joined_at: string }
interface B { profile_id: string; session_date: string; attended: boolean | null }

export default async function AdminIndex() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");
  if (!isAdmin(profile)) redirect("/today");

  const sb = getRequestClient();
  const today = todayMadridISO();
  const from30 = madridDateOffsetISO(-30);
  const ms = thisMonthStart();
  const [people, classes, events, bookings, rsvps, unread, briefs] = await Promise.all([
    sb.from("profiles").select("id, first_name, last_name, email, unit_number, role, joined_at").order("joined_at", { ascending: false }),
    sb.from("classes").select("id, active"),
    sb.from("events").select("id, date"),
    sb.from("bookings").select("profile_id, session_date, attended").gte("session_date", from30),
    sb.from("event_rsvps").select("event_id"),
    sb.rpc("my_unread_count"),
    sb.from("weekly_briefs").select("resident_id, published").eq("week_start", ms),
  ]);

  const residents = ((people.data ?? []) as P[]).filter((p) => p.role !== "admin");
  const bk = (bookings.data ?? []) as B[];
  const past = bk.filter((b) => b.session_date <= today);
  const marked = past.filter((b) => b.attended !== null && b.attended !== undefined);
  const attendedPct = marked.length ? Math.round((marked.filter((b) => b.attended).length / marked.length) * 100) : null;
  const toMark = past.filter((b) => b.attended === null || b.attended === undefined).length;
  const weekEnd = madridDateOffsetISO(6);
  const upcomingBookings = bk.filter((b) => b.session_date >= today && b.session_date <= weekEnd).length;
  const upcomingEvents = (events.data ?? []).filter((e) => (e.date as string) >= today).length;
  const activeClasses = (classes.data ?? []).filter((c) => c.active).length;
  const published = (briefs.data ?? []).filter((b) => b.published).length;
  const unreadN = typeof unread.data === "number" ? unread.data : 0;
  const sessionsBy = new Map<string, number>();
  for (const b of past) if (b.attended !== false) sessionsBy.set(b.profile_id, (sessionsBy.get(b.profile_id) ?? 0) + 1);

  const tiles = [
    { href: "/admin/messages", t: "Inbox", s: unreadN ? `${unreadN} unread` : "All caught up", badge: unreadN, dark: true },
    { href: "/admin/briefs", t: "Health briefs", s: `${published} of ${residents.length} published this month` },
    { href: "/admin/attendance", t: "Attendance", s: toMark ? `${toMark} to mark` : "Up to date", badge: toMark },
    { href: "/admin/classes", t: "Classes", s: `${activeClasses} a week` },
    { href: "/admin/events", t: "Events", s: `${upcomingEvents} upcoming · ${(rsvps.data ?? []).length} seats taken` },
  ];

  return (
    <main className="oa">
      <Link href="/account" className="oa-back">‹ Account</Link>
      <div>
        <div className="oa-eyebrow">Coach &amp; admin</div>
        <h1 className="oa-h1">The house</h1>
      </div>

      <div className="oa-tiles">
        {tiles.map((x) => (
          <Link key={x.href} href={x.href} className={`oa-card oa-tile${x.dark ? " oa-dark" : ""}`}>
            {x.badge ? <span className="oa-badge">{x.badge}</span> : null}
            <span className="t">{x.t}</span>
            <span className="s">{x.s}</span>
          </Link>
        ))}
      </div>

      <div className="oa-sec"><h2 className="oa-h2">At a glance</h2></div>
      <div className="oa-grid4">
        <div className="oa-card oa-stat"><div className="k">Residents</div><div className="oa-big" style={{ marginTop: 6 }}>{residents.length}</div></div>
        <div className="oa-card oa-stat"><div className="k">Booked · 7 days</div><div className="oa-big" style={{ marginTop: 6 }}>{upcomingBookings}</div></div>
        <div className="oa-card oa-stat"><div className="k">Sessions · 30 days</div><div className="oa-big" style={{ marginTop: 6 }}>{past.filter((b) => b.attended !== false).length}</div></div>
        <div className="oa-card oa-stat"><div className="k">Attendance</div><div className="oa-big" style={{ marginTop: 6 }}>{attendedPct === null ? "—" : `${attendedPct}%`}</div></div>
      </div>

      <div className="oa-sec"><h2 className="oa-h2">Residents</h2><span className="oa-sub">{residents.length}</span></div>
      {residents.length === 0 ? (
        <div className="oa-card oa-empty"><p>No residents yet.</p></div>
      ) : (
        <div className="oa-card oa-list">
          {residents.map((r) => {
            const name = `${r.first_name} ${r.last_name}`.trim() || r.email;
            return (
              <Link key={r.id} href={`/admin/briefs/${r.id}`} className="oa-li">
                <div className="oa-me" style={{ width: 40, height: 40, fontSize: 14 }}>{(name.charAt(0) || "R").toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{name}{r.unit_number && r.unit_number !== "—" ? ` · ${r.unit_number}` : ""}</div>
                  <div className="oa-meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.email}</div>
                </div>
                <span className="oa-meta">{sessionsBy.get(r.id) ?? 0} sessions</span>
              </Link>
            );
          })}
        </div>
      )}
      <div className="oa-footnote">Sessions and attendance over the last 30 days</div>
    </main>
  );
}

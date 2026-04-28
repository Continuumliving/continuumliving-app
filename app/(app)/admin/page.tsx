import { redirect } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";
import { Row } from "@/components/Row";
import { SpecRow } from "@/components/SpecRow";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";
import { isAdmin } from "@/lib/profile";
import { DAY_SHORT, MONTH_SHORT } from "@/lib/format";
import { nextOccurrenceISO } from "@/lib/dates";
import { DEVELOPMENTS } from "@/lib/types";
import type {
  BookingRow,
  ClassRow,
  EventRow,
  EventRsvpRow,
  ProfileRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type ProfileMini = Pick<
  ProfileRow,
  "id" | "first_name" | "last_name" | "email" | "development" | "unit_number" | "role"
>;

export default async function AdminIndex() {
  // Belt-and-braces: the (admin)/layout already gates on is_admin(),
  // but we re-check here so a misconfigured deploy can never leak
  // resident data.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");
  if (!isAdmin(profile)) redirect("/today");

  const supabase = getRequestClient();
  const [profilesRes, classesRes, eventsRes, bookingsRes, rsvpsRes] =
    await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, first_name, last_name, email, development, unit_number, role",
        )
        .order("joined_at", { ascending: false }),
      supabase
        .from("classes")
        .select("*")
        .order("day", { ascending: true })
        .order("time", { ascending: true }),
      supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true }),
      supabase
        .from("bookings")
        .select("id, profile_id, class_id, session_date, created_at"),
      supabase
        .from("event_rsvps")
        .select("id, profile_id, event_id, created_at"),
    ]);

  if (profilesRes.error) throw profilesRes.error;
  if (classesRes.error) throw classesRes.error;
  if (eventsRes.error) throw eventsRes.error;
  if (bookingsRes.error) throw bookingsRes.error;
  if (rsvpsRes.error) throw rsvpsRes.error;

  const profiles = (profilesRes.data ?? []) as ProfileMini[];
  const classes = (classesRes.data ?? []) as ClassRow[];
  const events = (eventsRes.data ?? []) as EventRow[];
  const bookings = (bookingsRes.data ?? []) as BookingRow[];
  const rsvps = (rsvpsRes.data ?? []) as EventRsvpRow[];

  const profileById = new Map(profiles.map((p) => [p.id, p]));

  // Per-class summary: count bookings for the next occurrence in
  // Madrid time, so the "spots left" matches what residents see.
  const classSummaries = classes
    .filter((c) => c.active)
    .map((cls) => {
      const next = nextOccurrenceISO(cls.day, cls.time);
      const total = bookings.filter(
        (b) => b.class_id === cls.id && b.session_date === next,
      ).length;
      return {
        cls,
        next,
        total,
        spotsLeft: Math.max(0, cls.capacity - total),
      };
    });

  // Per-event summary
  const eventSummaries = events.map((event) => {
    const total = rsvps.filter((r) => r.event_id === event.id).length;
    return {
      event,
      total,
      spotsLeft: Math.max(0, event.capacity - total),
    };
  });

  const totalBookings = bookings.length;
  const totalRsvps = rsvps.length;

  return (
    <div className="screen">
      <BackButton href="/account">Back to account</BackButton>

      <HeroNameCard
        eyebrow="— Administration"
        title={
          <>
            The house,
            <br />
            <em>curated.</em>
          </>
        }
        intro="A live read of residents, the weekly programme, and the seasonal calendar."
      />

      {/* ── Topline ── */}
      <div className="section-lead">
        <div className="eyebrow">— Topline</div>
      </div>
      <div className="stat-grid">
        <div className="stat warm">
          <div className="stat-num">{profiles.length}</div>
          <div className="stat-label">Residents</div>
        </div>
        <div className="stat warm">
          <div className="stat-num">{totalBookings}</div>
          <div className="stat-label">Class bookings</div>
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        <div
          className="stat warm stat-row"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <div>
            <div className="stat-label">Event reservations</div>
            <div className="since">Across all upcoming events</div>
          </div>
          <div className="stat-num" style={{ fontSize: 42 }}>
            {totalRsvps}
          </div>
        </div>
      </div>

      {/* ── Residents ── */}
      <div style={{ marginTop: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          — Residents · {profiles.length}
        </div>
        {profiles.length === 0 ? (
          <div className="empty-state">
            <p>No residents yet.</p>
          </div>
        ) : (
          profiles.map((p) => {
            const dev = DEVELOPMENTS[p.development];
            const fullName =
              `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() ||
              "Resident";
            return (
              <Row
                key={p.id}
                staticRow
                accent={p.role === "admin" ? "terracotta" : "olive"}
                title={fullName}
                subtitle={`${p.email}${p.unit_number ? ` · ${p.unit_number}` : ""}`}
                aside={
                  <>
                    {dev?.location ?? "—"}
                    {p.role === "admin" ? (
                      <>
                        <br />
                        <span className="row-time">admin</span>
                      </>
                    ) : null}
                  </>
                }
                asideTone={p.role === "admin" ? "terracotta" : "olive"}
              />
            );
          })
        )}
      </div>

      {/* ── Programme ── */}
      <div style={{ marginTop: 36 }}>
        <div
          className="eyebrow"
          style={{ marginBottom: 14, display: "flex", justifyContent: "space-between" }}
        >
          <span>— Programme · next session</span>
          <Link
            href="/admin/classes"
            style={{ color: "var(--terracotta)", textDecoration: "none" }}
          >
            Manage →
          </Link>
        </div>
        {classSummaries.length === 0 ? (
          <div className="empty-state">
            <p>No active classes.</p>
          </div>
        ) : (
          classSummaries.map(({ cls, next, total, spotsLeft }) => {
            const d = new Date(`${next}T12:00:00Z`);
            const dateLabel = `${DAY_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
            const full = spotsLeft === 0;
            return (
              <Link
                key={cls.id}
                href={`/admin/classes/${cls.id}`}
                className={`session-card ${cls.intensity}`}
              >
                <div className="session-top">
                  <div className="session-time">{cls.time}</div>
                  <span className={`session-intensity ${cls.intensity}`}>
                    {total} / {cls.capacity}
                  </span>
                </div>
                <div className="session-title">{cls.title}</div>
                <div className="session-location">
                  {dateLabel} · {cls.venue} · {cls.coach}
                </div>
                <div
                  className="booked-badge"
                  style={{
                    background: full ? "var(--terracotta)" : "var(--olive)",
                    marginTop: 10,
                  }}
                >
                  {full
                    ? "Fully booked"
                    : `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`}
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── Calendar ── */}
      <div style={{ marginTop: 36 }}>
        <div
          className="eyebrow"
          style={{ marginBottom: 14, display: "flex", justifyContent: "space-between" }}
        >
          <span>— Calendar · per event</span>
          <Link
            href="/admin/events"
            style={{ color: "var(--olive)", textDecoration: "none" }}
          >
            Manage →
          </Link>
        </div>
        {eventSummaries.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming events.</p>
          </div>
        ) : (
          eventSummaries.map(({ event, total, spotsLeft }) => {
            const d = new Date(`${event.date}T12:00:00Z`);
            const dateLabel = `${DAY_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
            const full = spotsLeft === 0;
            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="row accent"
              >
                <div className="row-main">
                  <div className="session-title" style={{ fontSize: 16 }}>
                    {event.title}
                  </div>
                  <div className="session-location">
                    {dateLabel} · {event.time} · {event.venue}
                  </div>
                </div>
                <div className="row-aside">
                  {total} / {event.capacity}
                  <br />
                  <span
                    className="row-time"
                    style={{
                      color: full ? "var(--terracotta)" : "var(--olive)",
                    }}
                  >
                    {full ? "full" : `${spotsLeft} left`}
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* ── Audit ── */}
      <div style={{ marginTop: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          — Audit · recent class bookings
        </div>
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings yet.</p>
          </div>
        ) : (
          bookings
            .slice(-10)
            .reverse()
            .map((b) => {
              const p = profileById.get(b.profile_id);
              const cls = classes.find((c) => c.id === b.class_id);
              const fullName =
                `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() ||
                p?.email ||
                "Resident";
              return (
                <SpecRow
                  key={b.id}
                  label={fullName}
                  value={`${cls?.title ?? "—"} · ${b.session_date}`}
                />
              );
            })
        )}
      </div>

      <div style={{ marginTop: 36, marginBottom: 8 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>
          — Audit · recent event reservations
        </div>
        {rsvps.length === 0 ? (
          <div className="empty-state">
            <p>No reservations yet.</p>
          </div>
        ) : (
          rsvps
            .slice(-10)
            .reverse()
            .map((r) => {
              const p = profileById.get(r.profile_id);
              const ev = events.find((e) => e.id === r.event_id);
              const fullName =
                `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim() ||
                p?.email ||
                "Resident";
              return (
                <SpecRow
                  key={r.id}
                  label={fullName}
                  value={ev?.title ?? "—"}
                />
              );
            })
        )}
      </div>

      <div style={{ marginTop: 28 }}>
        <Link href="/admin/classes/new" className="btn btn-terracotta">
          New class
        </Link>
      </div>
      <div style={{ marginTop: 10 }}>
        <Link href="/admin/events/new" className="btn btn-olive">
          New event
        </Link>
      </div>
    </div>
  );
}

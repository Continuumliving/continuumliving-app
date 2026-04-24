import { redirect } from "next/navigation";
import { HeroNameCard } from "@/components/HeroNameCard";
import { HeroQuote } from "@/components/HeroQuote";
import { StatGrid, StatRow } from "@/components/StatGrid";
import { SessionCard } from "@/components/SessionCard";
import { Row } from "@/components/Row";
import { getServerClient } from "@/lib/supabase/server";
import { fetchMyProfile } from "@/lib/profile";
import { fetchAllClasses } from "@/lib/classes";
import { fetchMyBookings, fetchMySessionHistory, countSessions } from "@/lib/bookings";
import { fetchAllEvents, fetchMyRsvps } from "@/lib/events";
import { DEVELOPMENTS } from "@/lib/types";
import {
  formatShortDate,
  greeting,
  madridDayOfWeek,
  todayMadridISO,
} from "@/lib/dates";
import { classSlug, MONTH_SHORT } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = getServerClient();
  const profile = await fetchMyProfile(supabase);
  if (!profile) redirect("/signin");

  const [classes, bookings, history, events, rsvps] = await Promise.all([
    fetchAllClasses(supabase),
    fetchMyBookings(supabase),
    fetchMySessionHistory(supabase),
    fetchAllEvents(supabase),
    fetchMyRsvps(supabase),
  ]);

  const today = madridDayOfWeek();
  const tomorrow = (today + 1) % 7;
  const todayClasses = classes.filter((c) => c.day === today);
  const tomorrowClasses = classes.filter((c) => c.day === tomorrow);

  const rsvpIds = new Set(rsvps.map((r) => r.event_id));
  const calendarEvents = events.filter((e) => rsvpIds.has(e.id)).slice(0, 2);

  const counts = countSessions(history);
  const development = DEVELOPMENTS[profile.development];

  const bookedKeys = new Set(
    bookings.map((b) => `${b.class_id}-${b.session_date}`),
  );

  const isBookedToday = (classId: string) =>
    bookedKeys.has(`${classId}-${todayMadridISO()}`);

  const joinedMonth =
    MONTH_SHORT[new Date(profile.joined_at).getUTCMonth()] ?? MONTH_SHORT[0];

  const displayFirst =
    (profile.first_name && profile.first_name.trim()) || "Resident";

  return (
    <div className="screen">
      <HeroNameCard
        eyebrow={`${formatShortDate(todayMadridISO())} · ${development.location}`}
        title={
          <>
            {greeting()},
            <br />
            <em>{displayFirst}.</em>
          </>
        }
      />

      <HeroQuote>
        Almina Residence — the new standard
        <br />
        for luxury living.
      </HeroQuote>

      <div className="section-lead">
        <div className="eyebrow">— Your season so far</div>
      </div>
      <StatGrid high={counts.high} low={counts.low} />
      <StatRow
        value={counts.total}
        label="Total sessions"
        since={`Since ${joinedMonth}`}
      />

      <div style={{ marginTop: 40 }}>
        <div className="eyebrow stone" style={{ marginBottom: 14 }}>
          — Today&apos;s sessions
        </div>
        {todayClasses.length === 0 ? (
          <div className="empty-state">
            <p>
              A quiet day.
              <br />
              The programme resumes tomorrow.
            </p>
          </div>
        ) : (
          todayClasses.map((c) => (
            <SessionCard
              key={c.id}
              slug={classSlug(c.day, c.time)}
              time={c.time}
              title={c.title}
              intensity={c.intensity}
              venue={c.venue}
              coach={c.coach}
              booked={isBookedToday(c.id)}
            />
          ))
        )}
      </div>

      {tomorrowClasses.length > 0 ? (
        <div style={{ marginTop: 40 }}>
          <div className="eyebrow stone" style={{ marginBottom: 14 }}>
            — Tomorrow
          </div>
          {tomorrowClasses.slice(0, 2).map((c) => (
            <Row
              key={c.id}
              href={`/classes/${classSlug(c.day, c.time)}`}
              accent="terracotta"
              title={c.title}
              subtitle={c.venue}
              aside={c.time}
            />
          ))}
        </div>
      ) : null}

      {calendarEvents.length > 0 ? (
        <div style={{ marginTop: 40 }}>
          <div className="eyebrow olive" style={{ marginBottom: 14 }}>
            — On your calendar
          </div>
          {calendarEvents.map((e) => (
            <Row
              key={e.id}
              href={`/events/${e.id}`}
              accent="olive"
              asideTone="olive"
              title={e.title}
              subtitle={e.venue}
              aside={formatShortDate(e.date)}
            />
          ))}
        </div>
      ) : null}

      <div className="footer-brand">
        <div className="name">{development.name}</div>
        <div className="series">
          {development.location} · {development.series}
        </div>
      </div>
    </div>
  );
}


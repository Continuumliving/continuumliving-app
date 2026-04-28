"use client";

import Link from "next/link";
import { AccountHero } from "@/components/AccountHero";
import { Row } from "@/components/Row";
import { SignOutButton } from "@/components/SignOutButton";
import { StatGrid, StatRow } from "@/components/StatGrid";
import {
  useBookings,
  useClasses,
  useHistory,
  useProfile,
  useRsvps,
} from "@/lib/data-context";
import { countSessions } from "@/lib/bookings";
import { DAY_SHORT, MONTH_SHORT } from "@/lib/format";
import { DEVELOPMENTS } from "@/lib/types";

export default function AccountPage() {
  const profile = useProfile();
  const bookings = useBookings();
  const history = useHistory();
  const rsvps = useRsvps();
  const classes = useClasses();

  if (!profile) return null;

  const counts = countSessions(history);
  const dev = DEVELOPMENTS[profile.development];
  const joined = new Date(profile.joined_at);
  const memberSince = `${MONTH_SHORT[joined.getUTCMonth()]} ${joined.getUTCFullYear()}`;

  const today = new Date().toISOString().slice(0, 10);
  const classById = new Map(classes.map((c) => [c.id, c]));
  const upcomingBookings = bookings
    .filter((b) => b.session_date >= today)
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .map((b) => ({ booking: b, cls: classById.get(b.class_id) }));

  return (
    <div className="screen">
      <AccountHero
        firstName={profile.first_name}
        lastName={profile.last_name}
        unit={profile.unit_number}
        email={profile.email}
        development={{
          id: profile.development,
          name: dev.name,
          location: dev.location,
        }}
      />

      <div className="section-lead">
        <div className="eyebrow">— Your activity</div>
      </div>

      <StatGrid high={counts.high} low={counts.low} />
      <StatRow
        value={upcomingBookings.length}
        label="Upcoming bookings"
        since="This week"
      />

      <div style={{ marginTop: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          — Session breakdown
        </div>
        <div className="activity-row">
          <span className="activity-label">High intensity completed</span>
          <span className="activity-value">{counts.high}</span>
        </div>
        <div className="activity-row">
          <span className="activity-label olive">Low intensity completed</span>
          <span className="activity-value">{counts.low}</span>
        </div>
        <div className="activity-row">
          <span className="activity-label stone">Events attended</span>
          <span className="activity-value">{rsvps.length}</span>
        </div>
        <div className="activity-row">
          <span className="activity-label ink">Total sessions</span>
          <span className="activity-value">{counts.total}</span>
        </div>
      </div>

      {upcomingBookings.length > 0 ? (
        <div style={{ marginTop: 36 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>
            — Upcoming bookings
          </div>
          {upcomingBookings.map(({ booking, cls }) => {
            if (!cls) return null;
            const dayName = DAY_SHORT[cls.day];
            return (
              <Row
                key={booking.id}
                accent="terracotta"
                title={cls.title}
                subtitle={cls.venue}
                aside={
                  <>
                    {dayName}
                    <br />
                    <span className="row-time">{cls.time}</span>
                  </>
                }
              />
            );
          })}
        </div>
      ) : null}

      {history.length > 0 ? (
        <div style={{ marginTop: 32 }}>
          <div className="eyebrow stone" style={{ marginBottom: 14 }}>
            — Recent sessions
          </div>
          {history.slice(0, 5).map((s) => {
            const d = new Date(`${s.session_date}T12:00:00Z`);
            const dateLabel = `${DAY_SHORT[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
            return (
              <Row
                key={s.id}
                accent={s.intensity === "high" ? "terracotta" : "olive"}
                staticRow
                title={s.title}
                subtitle={s.venue}
                aside={dateLabel}
                asideTone={s.intensity === "high" ? "terracotta" : "olive"}
              />
            );
          })}
        </div>
      ) : null}

      <div style={{ marginTop: 36 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          — Preferences
        </div>
        <a
          href="https://wa.me/+34609019874"
          target="_blank"
          rel="noopener noreferrer"
          className="row accent"
        >
          <div className="row-main">
            <span className="body-sm">Concierge, direct</span>
          </div>
          <div className="row-aside">WhatsApp</div>
        </a>
        <Row
          staticRow
          title={<span className="body-sm">Dietary & health notes</span>}
          aside="Edit"
        />
        <Row
          staticRow
          title={<span className="body-sm">Privacy preferences</span>}
          aside="Edit"
        />
      </div>

      {profile.role === "admin" ? (
        <div style={{ marginTop: 28 }}>
          <Link
            href="/admin"
            prefetch
            className="btn btn-ghost"
            style={{ display: "block" }}
          >
            Admin
          </Link>
        </div>
      ) : null}

      <div style={{ marginTop: 36 }}>
        <SignOutButton />
      </div>

      <div className="member-since">
        <span>Member since {memberSince}</span>
      </div>
    </div>
  );
}

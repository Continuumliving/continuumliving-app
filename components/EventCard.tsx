import Link from "next/link";
import { DAY_NAMES, MONTH_SHORT } from "@/lib/format";
import type { EventKind } from "@/lib/types";

interface EventCardProps {
  id: string;
  isoDate: string; // yyyy-mm-dd
  time: string;
  title: string;
  venue: string;
  kind: EventKind;
  rsvped?: boolean;
  href?: string;
}

const KIND_LABEL: Record<EventKind, string> = {
  dining: "Dining",
  social: "Social",
  workshop: "Workshop",
  excursion: "Excursion",
  signature: "Signature",
};

export function EventCard({
  id,
  isoDate,
  time,
  title,
  venue,
  kind,
  rsvped,
  href,
}: EventCardProps) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  const day = d.getUTCDate();
  const month = MONTH_SHORT[d.getUTCMonth()];
  const weekday = DAY_NAMES[d.getUTCDay()];
  const isSignature = kind === "signature";

  return (
    <Link
      href={href ?? `/events/${id}`}
      className={`event-card${isSignature ? " signature" : ""}`}
    >
      <div className="event-date-row">
        <div className="event-date-block">
          <div className="event-date-num">{String(day).padStart(2, "0")}</div>
          <div className="event-date-meta">
            <span className="month">{month}</span>
            <span className="event-day">{weekday}</span>
          </div>
        </div>
        <span className={`event-kind-tag tag-${kind}`}>{KIND_LABEL[kind]}</span>
      </div>
      <div className="event-title">{title}</div>
      <div className="event-venue">
        {venue} · {time}
      </div>
      {rsvped ? (
        <div
          className="booked-badge"
          style={{
            marginTop: 12,
            background: isSignature ? "var(--terracotta)" : undefined,
          }}
        >
          On the list
        </div>
      ) : null}
    </Link>
  );
}

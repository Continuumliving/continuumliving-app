import Link from "next/link";
import type { Intensity } from "@/lib/types";

interface SessionCardProps {
  slug: string;
  time: string;
  title: string;
  intensity: Intensity;
  venue: string;
  coach: string;
  booked?: boolean;
}

export function SessionCard({
  slug,
  time,
  title,
  intensity,
  venue,
  coach,
  booked,
}: SessionCardProps) {
  return (
    <Link href={`/classes/${slug}`} className={`session-card ${intensity}`}>
      <div className="session-top">
        <div className="session-time">{time}</div>
        <span className={`session-intensity ${intensity}`}>
          {intensity === "high" ? "High" : "Low"}
        </span>
      </div>
      <div className="session-title">{title}</div>
      <div className="session-location">
        {venue} · {coach}
      </div>
      {booked ? <div className="booked-badge">You are booked</div> : null}
    </Link>
  );
}

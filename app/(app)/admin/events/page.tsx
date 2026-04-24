import Link from "next/link";

import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";
import { EventCard } from "@/components/EventCard";
import { getRequestClient } from "@/lib/auth-cache";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const supabase = getRequestClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  const events = (data ?? []) as EventRow[];

  return (
    <div className="screen">
      <BackButton href="/admin">Back to admin</BackButton>

      <HeroNameCard
        tone="olive"
        eyebrow="— Calendar"
        title={
          <>
            Seasonal
            <br />
            <em style={{ color: "var(--olive)" }}>calendar.</em>
          </>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/events/new" className="btn btn-olive">
          New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events yet.</p>
        </div>
      ) : (
        events.map((e) => (
          <EventCard
            key={e.id}
            id={e.id}
            isoDate={e.date}
            time={e.time}
            title={e.title}
            venue={e.venue}
            kind={e.kind}
            href={`/admin/events/${e.id}`}
          />
        ))
      )}
    </div>
  );
}

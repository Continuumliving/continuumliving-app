import { HeroNameCard } from "@/components/HeroNameCard";
import { EventCard } from "@/components/EventCard";
import { getRequestClient } from "@/lib/auth-cache";
import { fetchAllEvents, fetchMyRsvps } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const supabase = getRequestClient();
  const [events, rsvps] = await Promise.all([
    fetchAllEvents(supabase),
    fetchMyRsvps(supabase),
  ]);
  const rsvpSet = new Set(rsvps.map((r) => r.event_id));

  return (
    <div className="screen">
      <HeroNameCard
        tone="olive"
        eyebrow="— The calendar"
        title={
          <>
            Twelve gatherings,
            <br />
            <em style={{ color: "var(--olive)" }}>each year.</em>
          </>
        }
        intro="Curated evenings and excursions for Continuum residents across Almina and Alcántara. Small numbers, careful details."
      />

      <div style={{ marginTop: 20 }}>
        {events.map((e) => (
          <EventCard
            key={e.id}
            id={e.id}
            isoDate={e.date}
            time={e.time}
            title={e.title}
            venue={e.venue}
            kind={e.kind}
            rsvped={rsvpSet.has(e.id)}
          />
        ))}
      </div>
    </div>
  );
}

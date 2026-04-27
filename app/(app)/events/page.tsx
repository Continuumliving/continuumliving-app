"use client";

import { HeroNameCard } from "@/components/HeroNameCard";
import { EventCard } from "@/components/EventCard";
import { useEvents, useRsvps } from "@/lib/data-context";

export default function EventsPage() {
  const events = useEvents();
  const rsvps = useRsvps();
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
        intro="Curated evenings and excursions for Almina Residence. Small numbers, careful details."
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

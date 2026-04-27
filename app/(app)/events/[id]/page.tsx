"use client";

import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/EventDetailView";
import { useEvents, useRsvps } from "@/lib/data-context";

export default function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const events = useEvents();
  const rsvps = useRsvps();

  const event = events.find((e) => e.id === params.id);
  if (!event) notFound();

  const myRsvp = rsvps.find((r) => r.event_id === event.id);

  return (
    <EventDetailView
      event={event}
      initialRsvpId={myRsvp?.id ?? null}
      // RLS prevents non-admins from reading aggregate counts; the
      // detail view falls back to capacity-only display.
      rsvpCount={0}
    />
  );
}

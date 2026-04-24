import { notFound } from "next/navigation";
import { EventDetailView } from "@/components/EventDetailView";
import { getRequestClient } from "@/lib/auth-cache";
import { fetchEventById, fetchMyRsvps, fetchRsvpCounts } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getRequestClient();
  const event = await fetchEventById(supabase, params.id);
  if (!event) notFound();

  const [myRsvps, counts] = await Promise.all([
    fetchMyRsvps(supabase),
    fetchRsvpCounts(supabase, [event.id]),
  ]);

  const mine = myRsvps.find((r) => r.event_id === event.id);

  return (
    <EventDetailView
      event={event}
      initialRsvpId={mine?.id ?? null}
      rsvpCount={counts[event.id] ?? 0}
    />
  );
}

import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/AdminEventForm";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";
import { getRequestClient } from "@/lib/auth-cache";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getRequestClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const event = data as EventRow;

  return (
    <div className="screen">
      <BackButton href="/admin/events">Back to calendar</BackButton>
      <HeroNameCard
        tone="olive"
        eyebrow="— Edit event"
        title={
          <>
            {event.title}
            <br />
            <em style={{ color: "var(--olive)" }}>in the calendar.</em>
          </>
        }
      />
      <AdminEventForm initial={event} />
    </div>
  );
}

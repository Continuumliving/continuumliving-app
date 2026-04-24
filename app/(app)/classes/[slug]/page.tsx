import { notFound, redirect } from "next/navigation";
import { ClassDetailView } from "@/components/ClassDetailView";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";
import { findBookingForClass } from "@/lib/bookings";
import { nextOccurrenceISO } from "@/lib/dates";
import { parseClassSlug } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const parsed = parseClassSlug(params.slug);
  if (!parsed) notFound();

  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");
  const supabase = getRequestClient();

  const { data: cls, error } = await supabase
    .from("classes")
    .select("*")
    .eq("day", parsed.day)
    .eq("time", parsed.time)
    .eq("active", true)
    .maybeSingle();
  if (error) throw error;
  if (!cls) notFound();

  const sessionDate = nextOccurrenceISO(cls.day, cls.time);
  const booking = await findBookingForClass(supabase, cls.id, sessionDate);

  return (
    <ClassDetailView
      cls={cls}
      initialBookingId={booking?.id ?? null}
      development={profile.development}
    />
  );
}

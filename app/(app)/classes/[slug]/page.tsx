"use client";

import { notFound } from "next/navigation";
import { ClassDetailView } from "@/components/ClassDetailView";
import { useBookings, useClasses, useProfile } from "@/lib/data-context";
import { nextOccurrenceISO } from "@/lib/dates";
import { parseClassSlug } from "@/lib/format";

export default function ClassDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const parsed = parseClassSlug(params.slug);
  const profile = useProfile();
  const classes = useClasses();
  const bookings = useBookings();

  if (!parsed) notFound();
  if (!profile) return null;

  const cls = classes.find(
    (c) => c.day === parsed.day && c.time === parsed.time && c.active,
  );
  if (!cls) notFound();

  const sessionDate = nextOccurrenceISO(cls.day, cls.time);
  const booking = bookings.find(
    (b) => b.class_id === cls.id && b.session_date === sessionDate,
  );

  return (
    <ClassDetailView
      cls={cls}
      initialBookingId={booking?.id ?? null}
      development={profile.development}
    />
  );
}

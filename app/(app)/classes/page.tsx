"use client";

import { ClassesView } from "@/components/ClassesView";
import { useBookings, useClasses } from "@/lib/data-context";

export default function ClassesPage() {
  const classes = useClasses();
  const bookings = useBookings();
  const bookedKeys = bookings.map((b) => `${b.class_id}|${b.session_date}`);
  return <ClassesView classes={classes} bookedKeys={bookedKeys} />;
}

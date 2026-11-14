import Link from "next/link";
import { AdminEventForm } from "@/components/AdminEventForm";

export default function NewEventPage() {
  return (
    <main className="oa">
      <Link href="/admin/events" className="oa-back">‹ Events</Link>
      <div><div className="oa-eyebrow">Calendar</div><h1 className="oa-h1">New event</h1></div>
      <AdminEventForm />
    </main>
  );
}

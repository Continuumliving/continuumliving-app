import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminEventForm } from "@/components/AdminEventForm";
import { getRequestClient } from "@/lib/auth-cache";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const sb = getRequestClient();
  const [{ data, error }, rs] = await Promise.all([
    sb.from("events").select("*").eq("id", params.id).maybeSingle(),
    sb.from("event_rsvps").select("profile_id").eq("event_id", params.id),
  ]);
  if (error) throw error;
  if (!data) notFound();
  const ev = data as EventRow;
  const ids = (rs.data ?? []).map((r) => r.profile_id as string);
  const { data: people } = ids.length
    ? await sb.from("profiles").select("id, first_name, last_name, unit_number").in("id", ids)
    : { data: [] as Array<{ id: string; first_name: string; last_name: string; unit_number: string }> };

  return (
    <main className="oa">
      <Link href="/admin/events" className="oa-back">‹ Events</Link>
      <div><div className="oa-eyebrow">Edit event</div><h1 className="oa-h1">{ev.title}</h1></div>
      <div className="oa-card oa-list">
        <div className="oa-kv"><span>Guests</span><span>{ids.length} of {ev.capacity}</span></div>
        {(people ?? []).map((p) => (
          <div key={p.id} className="oa-kv"><span>{p.first_name} {p.last_name}</span><span>{p.unit_number && p.unit_number !== "—" ? p.unit_number : ""}</span></div>
        ))}
      </div>
      <AdminEventForm initial={ev} />
    </main>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Thread } from "@/components/oa/Thread";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";

export const dynamic = "force-dynamic";

export default async function AdminThread({ params }: { params: { id: string } }) {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const { data: resident } = await getRequestClient()
    .from("profiles")
    .select("id, first_name, last_name, unit_number, email")
    .eq("id", params.id)
    .maybeSingle();
  if (!resident) notFound();
  const name = `${resident.first_name} ${resident.last_name}`.trim() || resident.email;

  return (
    <main className="oa oa-chat">
      <Link href="/admin/messages" className="oa-back">‹ Inbox</Link>
      <div className="oa-card oa-coachcard">
        <div className="oa-me" style={{ width: 52, height: 52 }}>{(name.charAt(0) || "R").toUpperCase()}</div>
        <div>
          <h1 className="oa-h2">{name}</h1>
          <div className="oa-sub" style={{ fontSize: 13, marginTop: 3 }}>{resident.unit_number && resident.unit_number !== "—" ? `Residence ${resident.unit_number} · ` : ""}{resident.email}</div>
        </div>
      </div>
      <Thread
        residentId={resident.id}
        meId={profile.id}
        otherName={resident.first_name || "Resident"}
        emptyText="No messages yet. Write first to welcome this resident."
        placeholder={`Reply to ${resident.first_name || "resident"}`}
      />
    </main>
  );
}

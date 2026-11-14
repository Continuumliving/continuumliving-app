import type { SupabaseClient } from "@supabase/supabase-js";

export interface CoachMessage {
  id: string;
  resident_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface InboxRow {
  resident_id: string;
  name: string;
  unit: string;
  last: CoachMessage;
  unread: number;
}

export async function fetchThread(supabase: SupabaseClient, residentId: string): Promise<CoachMessage[]> {
  const { data, error } = await supabase
    .from("coach_messages")
    .select("*")
    .eq("resident_id", residentId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as CoachMessage[];
}

export async function sendMessage(
  supabase: SupabaseClient,
  residentId: string,
  senderId: string,
  body: string,
): Promise<CoachMessage> {
  const { data, error } = await supabase
    .from("coach_messages")
    .insert({ resident_id: residentId, sender_id: senderId, body: body.trim().slice(0, 2000) })
    .select("*")
    .single();
  if (error) throw error;
  return data as CoachMessage;
}

export async function markThreadRead(supabase: SupabaseClient, residentId: string): Promise<void> {
  await supabase.rpc("mark_thread_read", { p_resident: residentId });
}

/** Admin only: one row per resident thread, newest first. */
export async function fetchInbox(supabase: SupabaseClient, coachId: string): Promise<InboxRow[]> {
  const [msgs, profiles] = await Promise.all([
    supabase.from("coach_messages").select("*").order("created_at", { ascending: false }).limit(2000),
    supabase.from("profiles").select("id, first_name, last_name, unit_number"),
  ]);
  if (msgs.error) throw msgs.error;
  if (profiles.error) throw profiles.error;
  const people = new Map(
    (profiles.data ?? []).map((p) => [p.id as string, p as { first_name: string; last_name: string; unit_number: string }]),
  );
  const rows = new Map<string, InboxRow>();
  for (const m of (msgs.data ?? []) as CoachMessage[]) {
    let r = rows.get(m.resident_id);
    if (!r) {
      const p = people.get(m.resident_id);
      r = {
        resident_id: m.resident_id,
        name: p ? `${p.first_name} ${p.last_name}`.trim() : "Resident",
        unit: p?.unit_number ?? "",
        last: m,
        unread: 0,
      };
      rows.set(m.resident_id, r);
    }
    if (!m.read_at && m.sender_id !== coachId) r.unread++;
  }
  return Array.from(rows.values());
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", day: "2-digit", month: "short" });
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit", hour12: false });
  return today.format(d) === today.format(new Date()) ? hm.format(d) : `${today.format(d)} · ${hm.format(d)}`;
}

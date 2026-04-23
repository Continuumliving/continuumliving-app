import type { SupabaseClient } from "@supabase/supabase-js";
import type { EventRow, EventRsvpRow } from "./types";

export async function fetchAllEvents(
  supabase: SupabaseClient,
): Promise<EventRow[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as EventRow[];
}

export async function fetchEventById(
  supabase: SupabaseClient,
  id: string,
): Promise<EventRow | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as EventRow | null;
}

export async function fetchMyRsvps(
  supabase: SupabaseClient,
): Promise<EventRsvpRow[]> {
  const { data, error } = await supabase.from("event_rsvps").select("*");
  if (error) throw error;
  return (data ?? []) as EventRsvpRow[];
}

export async function fetchRsvpCounts(
  supabase: SupabaseClient,
  eventIds: string[],
): Promise<Record<string, number>> {
  if (eventIds.length === 0) return {};
  const { data, error } = await supabase
    .from("event_rsvps")
    .select("event_id")
    .in("event_id", eventIds);
  if (error) throw error;
  const out: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = (row as { event_id: string }).event_id;
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}

export async function rsvpEvent(
  supabase: SupabaseClient,
  eventId: string,
): Promise<EventRsvpRow> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in.");
  const { data, error } = await supabase
    .from("event_rsvps")
    .insert({ profile_id: uid, event_id: eventId })
    .select()
    .single();
  if (error) throw error;
  return data as EventRsvpRow;
}

export async function cancelRsvp(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("event_rsvps").delete().eq("id", id);
  if (error) throw error;
}

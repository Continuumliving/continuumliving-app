import type { SupabaseClient } from "@supabase/supabase-js";
import type { BookingRow, ClassRow, Intensity, SessionHistoryRow } from "./types";

export async function fetchMyBookings(
  supabase: SupabaseClient,
): Promise<BookingRow[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("session_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as BookingRow[];
}

export async function fetchMyBookingsWithClass(
  supabase: SupabaseClient,
): Promise<Array<BookingRow & { class: ClassRow }>> {
  const { data, error } = await supabase
    .from("bookings")
    .select("*, class:classes(*)")
    .order("session_date", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Array<BookingRow & { class: ClassRow }>;
}

export async function bookClass(
  supabase: SupabaseClient,
  args: { classId: string; sessionDate: string },
): Promise<BookingRow> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Not signed in.");
  const { data, error } = await supabase
    .from("bookings")
    .insert({
      profile_id: uid,
      class_id: args.classId,
      session_date: args.sessionDate,
    })
    .select()
    .single();
  if (error) throw error;
  return data as BookingRow;
}

export async function cancelBooking(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.from("bookings").delete().eq("id", id);
  if (error) throw error;
}

export async function findBookingForClass(
  supabase: SupabaseClient,
  classId: string,
  sessionDate: string,
): Promise<BookingRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("profile_id", uid)
    .eq("class_id", classId)
    .eq("session_date", sessionDate)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as BookingRow | null;
}

export async function fetchMySessionHistory(
  supabase: SupabaseClient,
): Promise<SessionHistoryRow[]> {
  const { data, error } = await supabase
    .from("session_history")
    .select("*")
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SessionHistoryRow[];
}

export interface SessionCounts {
  high: number;
  low: number;
  total: number;
}

export function countSessions(rows: { intensity: Intensity }[]): SessionCounts {
  let high = 0;
  let low = 0;
  for (const r of rows) {
    if (r.intensity === "high") high += 1;
    else if (r.intensity === "low") low += 1;
  }
  return { high, low, total: rows.length };
}

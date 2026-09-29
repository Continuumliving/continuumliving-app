import "server-only";

import { getRequestClient } from "./auth-cache";
import type {
  BookingRow,
  ClassRow,
  EventRow,
  EventRsvpRow,
  ProfileRow,
} from "./types";

export interface AdminData {
  profiles: ProfileRow[];
  classes: ClassRow[];
  events: EventRow[];
  bookings: BookingRow[];
  rsvps: EventRsvpRow[];
}

/**
 * One parallel read of every table the back office needs. Relies on
 * the admin SELECT policies from migration 0005. Volumes for a single
 * residence are small (hundreds of rows), so pages filter in memory
 * rather than issuing bespoke queries.
 */
export async function loadAdminData(): Promise<AdminData> {
  const supabase = getRequestClient();
  const [p, c, e, b, r] = await Promise.all([
    supabase.from("profiles").select("*").order("joined_at", { ascending: false }),
    supabase
      .from("classes")
      .select("*")
      .order("day", { ascending: true })
      .order("time", { ascending: true }),
    supabase.from("events").select("*").order("date", { ascending: true }),
    supabase.from("bookings").select("*").order("session_date", { ascending: false }),
    supabase.from("event_rsvps").select("*").order("created_at", { ascending: false }),
  ]);
  for (const res of [p, c, e, b, r]) if (res.error) throw res.error;
  return {
    profiles: (p.data ?? []) as ProfileRow[],
    classes: (c.data ?? []) as ClassRow[],
    events: (e.data ?? []) as EventRow[],
    bookings: (b.data ?? []) as BookingRow[],
    rsvps: (r.data ?? []) as EventRsvpRow[],
  };
}

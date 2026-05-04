import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";
import { fetchAllClasses } from "@/lib/classes";
import { fetchAllEvents, fetchMyRsvps } from "@/lib/events";
import {
  fetchMyBookings,
  fetchMySessionHistory,
} from "@/lib/bookings";
import { DataProvider, type InitialData } from "@/lib/data-context";

/**
 * Wrap a single Supabase fetch so one broken table or missing
 * migration cannot 500 the entire app shell. Logs the underlying
 * error to the server console (visible in `vercel logs`) and
 * resolves to the supplied fallback so the rest of the layout
 * still renders.
 */
async function safe<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[(app)/layout] ${label} failed:`, err);
    return fallback;
  }
}

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth gate first — no point fetching anything else if we're going
  // to redirect.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");

  // One server-side parallel fetch on first load. The DataProvider
  // seeds SWR with this — every subsequent tab switch reads from the
  // in-memory cache and does not hit the server at all (within the
  // 5-minute stale window). Each query is resilient to its own
  // failure: a missing table or RLS hiccup degrades to an empty
  // list instead of taking the whole layout down with it.
  const supabase = getRequestClient();
  const [classes, events, bookings, rsvps, history] = await Promise.all([
    safe("fetchAllClasses", () => fetchAllClasses(supabase), []),
    safe("fetchAllEvents", () => fetchAllEvents(supabase), []),
    safe("fetchMyBookings", () => fetchMyBookings(supabase), []),
    safe("fetchMyRsvps", () => fetchMyRsvps(supabase), []),
    safe("fetchMySessionHistory", () => fetchMySessionHistory(supabase), []),
  ]);

  const initial: InitialData = {
    profile,
    classes,
    events,
    bookings,
    rsvps,
    history,
  };

  return (
    <DataProvider initial={initial}>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </DataProvider>
  );
}

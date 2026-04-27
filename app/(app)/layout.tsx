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
  // 5-minute stale window).
  const supabase = getRequestClient();
  const [classes, events, bookings, rsvps, history] = await Promise.all([
    fetchAllClasses(supabase),
    fetchAllEvents(supabase),
    fetchMyBookings(supabase),
    fetchMyRsvps(supabase),
    fetchMySessionHistory(supabase),
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

"use client";

import type { ReactNode } from "react";
import useSWR, { SWRConfig, useSWRConfig, type SWRConfiguration } from "swr";
import { getBrowserClient } from "@/lib/supabase/client";
import {
  fetchAllClasses,
} from "@/lib/classes";
import {
  fetchMyBookings,
  fetchMySessionHistory,
} from "@/lib/bookings";
import {
  fetchAllEvents,
  fetchMyRsvps,
} from "@/lib/events";
import { fetchMyProfile } from "@/lib/profile";
import type {
  BookingRow,
  ClassRow,
  EventRow,
  EventRsvpRow,
  ProfileRow,
  SessionHistoryRow,
} from "@/lib/types";

export const KEY = {
  profile: "continuum:profile",
  classes: "continuum:classes",
  events: "continuum:events",
  bookings: "continuum:bookings",
  rsvps: "continuum:rsvps",
  history: "continuum:history",
} as const;

export interface InitialData {
  profile: ProfileRow | null;
  classes: ClassRow[];
  events: EventRow[];
  bookings: BookingRow[];
  rsvps: EventRsvpRow[];
  history: SessionHistoryRow[];
}

const fetchers: Record<string, () => Promise<unknown>> = {
  [KEY.profile]: async () => fetchMyProfile(getBrowserClient()),
  [KEY.classes]: async () => fetchAllClasses(getBrowserClient()),
  [KEY.events]: async () => fetchAllEvents(getBrowserClient()),
  [KEY.bookings]: async () => fetchMyBookings(getBrowserClient()),
  [KEY.rsvps]: async () => fetchMyRsvps(getBrowserClient()),
  [KEY.history]: async () => fetchMySessionHistory(getBrowserClient()),
};

const swrConfig: SWRConfiguration = {
  // Stale-while-revalidate window. Within this we never refetch on
  // tab switch / mount / focus — pages just rerender from cache.
  dedupingInterval: 5 * 60 * 1000,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  keepPreviousData: true,
  fetcher: (key: string) => {
    const f = fetchers[key];
    if (!f) throw new Error(`Unknown SWR key: ${key}`);
    return f();
  },
};

export function DataProvider({
  initial,
  children,
}: {
  initial: InitialData;
  children: ReactNode;
}) {
  return (
    <SWRConfig
      value={{
        ...swrConfig,
        fallback: {
          [KEY.profile]: initial.profile,
          [KEY.classes]: initial.classes,
          [KEY.events]: initial.events,
          [KEY.bookings]: initial.bookings,
          [KEY.rsvps]: initial.rsvps,
          [KEY.history]: initial.history,
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}

export function useProfile(): ProfileRow | null {
  const { data } = useSWR<ProfileRow | null>(KEY.profile);
  return data ?? null;
}

export function useClasses(): ClassRow[] {
  const { data } = useSWR<ClassRow[]>(KEY.classes);
  return data ?? [];
}

export function useEvents(): EventRow[] {
  const { data } = useSWR<EventRow[]>(KEY.events);
  return data ?? [];
}

export function useBookings(): BookingRow[] {
  const { data } = useSWR<BookingRow[]>(KEY.bookings);
  return data ?? [];
}

export function useRsvps(): EventRsvpRow[] {
  const { data } = useSWR<EventRsvpRow[]>(KEY.rsvps);
  return data ?? [];
}

export function useHistory(): SessionHistoryRow[] {
  const { data } = useSWR<SessionHistoryRow[]>(KEY.history);
  return data ?? [];
}

/**
 * Returns a typed object with helpers that update the SWR cache
 * after mutations, optimistically where possible. Pages call
 * these instead of refetching the lists.
 */
export function useDataMutations() {
  const { mutate } = useSWRConfig();

  return {
    addBooking(row: BookingRow) {
      mutate(
        KEY.bookings,
        (current: BookingRow[] | undefined) => [...(current ?? []), row],
        { revalidate: false },
      );
      // session_history is appended by a DB trigger — the safest path
      // is to revalidate just that key, which is a single SELECT.
      mutate(KEY.history);
    },
    removeBooking(id: string) {
      mutate(
        KEY.bookings,
        (current: BookingRow[] | undefined) =>
          (current ?? []).filter((b) => b.id !== id),
        { revalidate: false },
      );
      mutate(KEY.history);
    },
    addRsvp(row: EventRsvpRow) {
      mutate(
        KEY.rsvps,
        (current: EventRsvpRow[] | undefined) => [...(current ?? []), row],
        { revalidate: false },
      );
    },
    removeRsvp(id: string) {
      mutate(
        KEY.rsvps,
        (current: EventRsvpRow[] | undefined) =>
          (current ?? []).filter((r) => r.id !== id),
        { revalidate: false },
      );
    },
    /** Force-refresh a specific cache key from the server. */
    revalidate(
      key: keyof typeof KEY,
    ): Promise<unknown> {
      return mutate(KEY[key]);
    },
  };
}

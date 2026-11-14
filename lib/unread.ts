"use client";

import useSWR from "swr";
import { getBrowserClient } from "@/lib/supabase/client";

export const UNREAD_KEY = "continuum:unread";

/** Unread coach messages for the signed-in user (polls gently). */
export function useUnread(): number {
  const { data } = useSWR<number>(
    UNREAD_KEY,
    async () => {
      const { data, error } = await getBrowserClient().rpc("my_unread_count");
      if (error) return 0;
      return (data as number) ?? 0;
    },
    { refreshInterval: 30000, revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 5000 },
  );
  return data ?? 0;
}

import "server-only";

import { cache } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getServerClient } from "./supabase/server";
import { ensureMyProfile } from "./profile";
import type { ProfileRow } from "./types";

/**
 * Per-request memoised Supabase server client. Multiple `getServerClient()`
 * calls across a single render tree would each build a fresh cookie store;
 * with `cache()` we build it once.
 */
export const getRequestClient = cache((): SupabaseClient => getServerClient());

/**
 * Per-request memoised auth user. The underlying Supabase call does an
 * HTTP round-trip to auth.supabase.co to validate the JWT — doing that
 * once per page load instead of 3–4 times is the single biggest server
 * latency win.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = getRequestClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
});

/**
 * Per-request memoised profile. Reuses the cached user, so the profile
 * SELECT (and any first-time ensureMyProfile UPDATE) runs at most once
 * per render tree, even if the layout and the page both ask for it.
 */
export const getCurrentProfile = cache(
  async (): Promise<ProfileRow | null> => {
    const user = await getCurrentUser();
    if (!user) return null;
    const supabase = getRequestClient();
    return ensureMyProfile(supabase, user);
  },
);

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileRow } from "./types";

export async function fetchMyProfile(
  supabase: SupabaseClient,
): Promise<ProfileRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ProfileRow | null;
}

export function isAdmin(profile: ProfileRow | null): boolean {
  return profile?.role === "admin";
}

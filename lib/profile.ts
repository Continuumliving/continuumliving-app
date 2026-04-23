import type { SupabaseClient } from "@supabase/supabase-js";
import type { Development, ProfileRow } from "./types";

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

/**
 * Ensure the signed-in user has a `profiles` row. Acts as a client-side
 * safety net for the `handle_new_auth_user` DB trigger: if the trigger
 * was disabled, errored, or the user predates the migration, we create
 * the row from `user_metadata` here.
 *
 * Returns the profile (either the existing row or the freshly inserted
 * one), or `null` if the user is not signed in.
 */
export async function ensureMyProfile(
  supabase: SupabaseClient,
): Promise<ProfileRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const existing = await fetchMyProfile(supabase);
  if (existing) return existing;

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const devRaw = typeof md.development === "string" ? md.development : "";
  const development: Development =
    devRaw === "almina" || devRaw === "alcantara" ? devRaw : "almina";

  const payload = {
    id: user.id,
    email: user.email ?? "",
    first_name:
      typeof md.first_name === "string" && md.first_name.length > 0
        ? md.first_name
        : (user.email ?? "").split("@")[0] || "Resident",
    last_name: typeof md.last_name === "string" ? md.last_name : "",
    development,
    unit_number: typeof md.unit_number === "string" ? md.unit_number : "—",
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

export function isAdmin(profile: ProfileRow | null): boolean {
  return profile?.role === "admin";
}

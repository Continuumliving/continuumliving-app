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

function firstNameFromMetadata(
  md: Record<string, unknown>,
  email: string | null | undefined,
): string {
  if (typeof md.first_name === "string" && md.first_name.trim().length > 0) {
    return md.first_name.trim();
  }
  const local = (email ?? "").split("@")[0];
  if (local.length > 0) {
    // "tomash.marko" → "Tomash"
    const head = local.split(/[._-]/)[0];
    return head.charAt(0).toUpperCase() + head.slice(1);
  }
  return "Resident";
}

/**
 * Ensure the signed-in user has a `profiles` row. Acts as a client-side
 * safety net for the `handle_new_auth_user` DB trigger: if the trigger
 * was disabled, errored, or the user predates the migration, we create
 * the row from `user_metadata` here. We also patch obviously-empty
 * fields on existing profiles (e.g. users created when the trigger was
 * still broken) so the UI doesn't end up rendering "Good morning, Mr .".
 */
export async function ensureMyProfile(
  supabase: SupabaseClient,
): Promise<ProfileRow | null> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const md = (user.user_metadata ?? {}) as Record<string, unknown>;
  const devRaw = typeof md.development === "string" ? md.development : "";
  const development: Development =
    devRaw === "almina" || devRaw === "alcantara" ? devRaw : "almina";
  const derivedFirst = firstNameFromMetadata(md, user.email);
  const metadataLast =
    typeof md.last_name === "string" ? md.last_name.trim() : "";
  const metadataUnit =
    typeof md.unit_number === "string" ? md.unit_number.trim() : "";

  const existing = await fetchMyProfile(supabase);
  if (existing) {
    // Patch empty/missing fields from auth metadata so legacy profiles
    // (created before the trigger was hardened) self-heal.
    const patch: Partial<ProfileRow> = {};
    if (!existing.first_name || existing.first_name.trim() === "") {
      patch.first_name = derivedFirst;
    }
    if ((!existing.last_name || existing.last_name.trim() === "") && metadataLast) {
      patch.last_name = metadataLast;
    }
    if ((!existing.unit_number || existing.unit_number.trim() === "") && metadataUnit) {
      patch.unit_number = metadataUnit;
    }
    if ((!existing.email || existing.email.trim() === "") && user.email) {
      patch.email = user.email;
    }
    if (Object.keys(patch).length === 0) return existing;

    const { data, error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", user.id)
      .select("*")
      .single();
    if (error) throw error;
    return data as ProfileRow;
  }

  const payload = {
    id: user.id,
    email: user.email ?? "",
    first_name: derivedFirst,
    last_name: metadataLast,
    development,
    unit_number: metadataUnit || "—",
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

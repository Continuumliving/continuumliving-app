import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassRow } from "./types";

export async function fetchAllClasses(
  supabase: SupabaseClient,
): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("active", true)
    .order("day", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClassRow[];
}

export async function fetchClassById(
  supabase: SupabaseClient,
  id: string,
): Promise<ClassRow | null> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data ?? null) as ClassRow | null;
}

export async function fetchClassesForDay(
  supabase: SupabaseClient,
  day: number,
): Promise<ClassRow[]> {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("active", true)
    .eq("day", day)
    .order("time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ClassRow[];
}

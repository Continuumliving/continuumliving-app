"use client";

import { getBrowserClient } from "./supabase/client";
import type { ProfileRow } from "./types";

/**
 * Client-side admin mutations. Every call is authorised by the
 * database (RLS policies in 0005/0006 check is_admin()), so a
 * non-admin calling these simply gets an error back.
 */

function friendly(err: { message?: string; code?: string } | null): Error {
  const msg = err?.message ?? "Something went wrong.";
  if (/row-level security|permission denied/i.test(msg)) {
    return new Error(
      "Not permitted. Run migration 0006_back_office.sql in Supabase to enable admin editing.",
    );
  }
  if (/duplicate key|unique/i.test(msg)) return new Error("Already booked.");
  if (/at capacity/i.test(msg)) return new Error("This event is full.");
  if (/at least one admin/i.test(msg)) return new Error("At least one admin must remain.");
  return new Error(msg);
}

export async function updateResident(
  id: string,
  patch: Partial<Pick<ProfileRow, "first_name" | "last_name" | "unit_number" | "role">>,
) {
  const { error } = await getBrowserClient().from("profiles").update(patch).eq("id", id);
  if (error) throw friendly(error);
}

export async function adminBook(profileId: string, classId: string, sessionDate: string) {
  const { error } = await getBrowserClient()
    .from("bookings")
    .insert({ profile_id: profileId, class_id: classId, session_date: sessionDate });
  if (error) throw friendly(error);
}

/**
 * Cancel a booking. Also removes the history line the booking trigger
 * wrote, so a cancelled session doesn't count towards the resident's
 * session totals.
 */
export async function adminCancelBooking(b: {
  id: string;
  profile_id: string;
  class_id: string;
  session_date: string;
}) {
  const supabase = getBrowserClient();
  const { error } = await supabase.from("bookings").delete().eq("id", b.id);
  if (error) throw friendly(error);
  await supabase
    .from("session_history")
    .delete()
    .eq("profile_id", b.profile_id)
    .eq("class_id", b.class_id)
    .eq("session_date", b.session_date);
}

export async function adminAddRsvp(profileId: string, eventId: string) {
  const { error } = await getBrowserClient()
    .from("event_rsvps")
    .insert({ profile_id: profileId, event_id: eventId });
  if (error) throw friendly(error);
}

export async function adminRemoveRsvp(id: string) {
  const { error } = await getBrowserClient().from("event_rsvps").delete().eq("id", id);
  if (error) throw friendly(error);
}

export async function saveClass(id: string | null, payload: Record<string, unknown>) {
  const supabase = getBrowserClient();
  const { error } = id
    ? await supabase.from("classes").update(payload).eq("id", id)
    : await supabase.from("classes").insert(payload);
  if (error) throw friendly(error);
}

export async function deleteClass(id: string) {
  const { error } = await getBrowserClient().from("classes").delete().eq("id", id);
  if (error) throw friendly(error);
}

export async function saveEvent(id: string | null, payload: Record<string, unknown>) {
  const supabase = getBrowserClient();
  const { error } = id
    ? await supabase.from("events").update(payload).eq("id", id)
    : await supabase.from("events").insert(payload);
  if (error) throw friendly(error);
}

export async function deleteEvent(id: string) {
  const { error } = await getBrowserClient().from("events").delete().eq("id", id);
  if (error) throw friendly(error);
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

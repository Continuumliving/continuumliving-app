"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import {
  adminAddRsvp,
  adminBook,
  adminCancelBooking,
  adminRemoveRsvp,
  downloadCsv,
} from "@/lib/admin-actions";
import { toCsv } from "@/lib/admin-format";

function useAction() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      router.refresh();
    } catch (err) {
      toast((err as Error).message || "That did not work.");
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}

export function CancelBookingButton({
  booking,
  label = "Cancel",
  who,
}: {
  booking: { id: string; profile_id: string; class_id: string; session_date: string };
  label?: string;
  who?: string;
}) {
  const { busy, run } = useAction();
  return (
    <button
      type="button"
      className="bo-link-btn"
      disabled={busy}
      onClick={() => {
        if (!window.confirm(`Cancel this booking${who ? ` for ${who}` : ""}?`)) return;
        run(() => adminCancelBooking(booking), "Booking cancelled.");
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}

export function RemoveRsvpButton({ id, who, label = "Remove" }: { id: string; who?: string; label?: string }) {
  const { busy, run } = useAction();
  return (
    <button
      type="button"
      className="bo-link-btn"
      disabled={busy}
      onClick={() => {
        if (!window.confirm(`Remove this reservation${who ? ` for ${who}` : ""}?`)) return;
        run(() => adminRemoveRsvp(id), "Reservation removed.");
      }}
    >
      {busy ? "…" : label}
    </button>
  );
}

/**
 * A select + button that adds a booking or RSVP. One side is fixed
 * (the resident, the session or the event); the select supplies the
 * other. For "booking" with a fixed resident, option values are
 * "classId|yyyy-mm-dd".
 */
export function AdminAdd({
  kind,
  fixed,
  options,
  placeholder,
  button = "Add",
}: {
  kind: "booking" | "rsvp";
  fixed: { profileId?: string; classId?: string; date?: string; eventId?: string };
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  button?: string;
}) {
  const { busy, run } = useAction();
  const [value, setValue] = useState("");

  function add() {
    if (!value) return;
    if (kind === "booking") {
      const [profileId, classId, date] = fixed.profileId
        ? [fixed.profileId, ...value.split("|")]
        : [value, fixed.classId!, fixed.date!];
      run(() => adminBook(profileId, classId, date), "Booked.").then(() => setValue(""));
    } else {
      const [profileId, eventId] = fixed.profileId ? [fixed.profileId, value] : [value, fixed.eventId!];
      run(() => adminAddRsvp(profileId, eventId), "Reservation added.").then(() => setValue(""));
    }
  }

  if (options.length === 0) return null;
  return (
    <div className="bo-inline-add">
      <select className="bo-select" value={value} onChange={(e) => setValue(e.target.value)} aria-label={placeholder}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button type="button" className="bo-btn" disabled={!value || busy} onClick={add}>
        {busy ? "Adding…" : button}
      </button>
    </div>
  );
}

export function ExportButton({
  filename,
  headers,
  rows,
  label = "Export CSV",
}: {
  filename: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="bo-btn sm"
      disabled={rows.length === 0}
      onClick={() => downloadCsv(filename, toCsv(headers, rows))}
    >
      {label}
    </button>
  );
}

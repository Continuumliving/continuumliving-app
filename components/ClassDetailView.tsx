"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BackButton } from "./BackButton";
import { SpecRow } from "./SpecRow";
import { useToast } from "./Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import { bookClass, cancelBooking, findBookingForClass } from "@/lib/bookings";
import { formatLongDate, nextOccurrenceISO } from "@/lib/dates";
import type { ClassRow, Development } from "@/lib/types";
import { DEVELOPMENTS } from "@/lib/types";

interface ClassDetailViewProps {
  cls: ClassRow;
  initialBookingId: string | null;
  development: Development;
}

export function ClassDetailView({
  cls,
  initialBookingId,
  development,
}: ClassDetailViewProps) {
  const router = useRouter();
  const toast = useToast();
  const [bookingId, setBookingId] = useState<string | null>(initialBookingId);
  const [busy, setBusy] = useState(false);

  const sessionDate = nextOccurrenceISO(cls.day, cls.time);
  const dev = DEVELOPMENTS[development];

  async function book() {
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const row = await bookClass(supabase, {
        classId: cls.id,
        sessionDate,
      });
      setBookingId(row.id);
      toast("Reserved. We will see you there.");
      router.refresh();
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast("You are already booked for this session.");
        const supabase = getBrowserClient();
        const existing = await findBookingForClass(supabase, cls.id, sessionDate);
        if (existing) setBookingId(existing.id);
      } else {
        toast("We could not hold that session just now.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!bookingId) return;
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      await cancelBooking(supabase, bookingId);
      setBookingId(null);
      toast("Booking released.");
      router.refresh();
    } catch {
      toast("We could not release that booking just now.");
    } finally {
      setBusy(false);
    }
  }

  const booked = !!bookingId;

  return (
    <div className="screen">
      <BackButton href="/classes">Back to schedule</BackButton>

      <div className="detail-hero">
        <span className={`class-tag ${cls.intensity}`}>
          {cls.intensity === "high" ? "High intensity" : "Low intensity"}
        </span>
        <h1 className="h1" style={{ marginTop: 20 }}>
          {cls.title}
        </h1>
        <p className="body-md" style={{ marginTop: 18 }}>
          {cls.description}
        </p>
      </div>

      <div style={{ marginTop: 10 }}>
        <SpecRow label="Next session" value={formatLongDate(sessionDate)} />
        <SpecRow label="Time" value={cls.time} />
        <SpecRow label="Duration" value={`${cls.duration_min} min`} />
        <SpecRow label="Venue" value={cls.venue} />
        <SpecRow label="Coach" value={cls.coach} />
        <SpecRow label="Residence" value={dev.name.replace(" Residences", "")} />
      </div>

      <div style={{ marginTop: 32 }}>
        {booked ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={cancel}
            disabled={busy}
          >
            {busy ? "Releasing…" : "Cancel booking"}
          </button>
        ) : (
          <button
            type="button"
            className={`btn ${cls.intensity === "high" ? "btn-terracotta" : "btn-olive"}`}
            onClick={book}
            disabled={busy}
          >
            {busy ? "Reserving…" : "Reserve my place"}
          </button>
        )}
      </div>

      <p
        style={{
          marginTop: 18,
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          color: "var(--stone-deep)",
          textAlign: "center",
          fontSize: 13,
        }}
      >
        {booked
          ? "We will see you there. Please arrive five minutes early."
          : "Bookings are included in your residence membership."}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { BackButton } from "./BackButton";
import { SpecRow } from "./SpecRow";
import { useToast } from "./Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import { cancelRsvp, rsvpEvent } from "@/lib/events";
import { useDataMutations } from "@/lib/data-context";
import { formatLongDate } from "@/lib/dates";
import type { EventKind, EventRow } from "@/lib/types";

const KIND_LABEL: Record<EventKind, string> = {
  dining: "Dining",
  social: "Social",
  workshop: "Workshop",
  excursion: "Excursion",
  signature: "Signature",
};

interface EventDetailViewProps {
  event: EventRow;
  initialRsvpId: string | null;
  rsvpCount: number;
}

export function EventDetailView({
  event,
  initialRsvpId,
  rsvpCount,
}: EventDetailViewProps) {
  const toast = useToast();
  const { addRsvp, removeRsvp } = useDataMutations();
  const [rsvpId, setRsvpId] = useState<string | null>(initialRsvpId);
  const [count, setCount] = useState(rsvpCount);
  const [busy, setBusy] = useState(false);

  const spotsLeft = Math.max(0, event.capacity - count);
  const rsvped = !!rsvpId;

  async function add() {
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const row = await rsvpEvent(supabase, event.id);
      setRsvpId(row.id);
      setCount((c) => c + 1);
      addRsvp(row);
      toast("Added. We will confirm details the day before.");
    } catch (err) {
      const msg = (err as Error).message || "";
      if (msg.includes("capacity")) {
        toast("This gathering is now fully subscribed.");
      } else if (msg.includes("duplicate") || msg.includes("unique")) {
        toast("Your name is already on the list.");
      } else {
        toast("We could not add your name just now.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!rsvpId) return;
    const id = rsvpId;
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      await cancelRsvp(supabase, id);
      setRsvpId(null);
      setCount((c) => Math.max(0, c - 1));
      removeRsvp(id);
      toast("Your name has been removed.");
    } catch {
      toast("We could not remove your name just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="screen">
      <BackButton href="/events">Back to calendar</BackButton>

      <div className="detail-hero">
        <span className={`event-kind-tag tag-${event.kind}`}>
          {KIND_LABEL[event.kind]}
        </span>
        <h1 className="h1" style={{ marginTop: 20 }}>
          {event.title}
        </h1>
        <p className="body-md" style={{ marginTop: 18 }}>
          {event.description}
        </p>
      </div>

      <div style={{ marginTop: 10 }}>
        <SpecRow label="Date" value={formatLongDate(event.date)} />
        <SpecRow label="Time" value={event.time} />
        <SpecRow label="Venue" value={event.venue} />
        <SpecRow label="Host" value={event.host} />
        <SpecRow
          label="Availability"
          value={`${spotsLeft} of ${event.capacity}`}
        />
      </div>

      <div style={{ marginTop: 32 }}>
        {rsvped ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={remove}
            disabled={busy}
          >
            {busy ? "Removing…" : "Remove my name"}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-olive"
            onClick={add}
            disabled={busy || spotsLeft === 0}
          >
            {spotsLeft === 0
              ? "Fully subscribed"
              : busy
                ? "Adding…"
                : "Add my name"}
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
        {rsvped
          ? "We will confirm details the day before."
          : "A confirmation will reach you after adding your name."}
      </p>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import type { EventKind, EventRow } from "@/lib/types";

interface AdminEventFormProps {
  initial?: EventRow;
}

export function AdminEventForm({ initial }: AdminEventFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState<string>(initial?.date ?? "");
  const [time, setTime] = useState<string>(initial?.time ?? "19:00");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [venue, setVenue] = useState<string>(initial?.venue ?? "");
  const [host, setHost] = useState<string>(initial?.host ?? "");
  const [capacity, setCapacity] = useState<number>(initial?.capacity ?? 24);
  const [kind, setKind] = useState<EventKind>(initial?.kind ?? "dining");
  const [description, setDescription] = useState<string>(
    initial?.description ?? "",
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time || !title || !venue || !host || !description) {
      toast("Please complete every field.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const payload = {
        date,
        time,
        title: title.trim(),
        venue: venue.trim(),
        host: host.trim(),
        capacity,
        kind,
        description: description.trim(),
      };
      if (initial) {
        const { error } = await supabase
          .from("events")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast("Event updated.");
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
        toast("Event added.");
      }
      router.replace("/admin/events");
      router.refresh();
    } catch (err) {
      toast((err as Error).message || "We could not save that event.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!window.confirm("Remove this event from the calendar?")) return;
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", initial.id);
      if (error) throw error;
      toast("Event removed.");
      router.replace("/admin/events");
      router.refresh();
    } catch (err) {
      toast((err as Error).message || "We could not remove that event.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="time">Time (HH:MM)</label>
        <input
          id="time"
          type="text"
          value={time}
          placeholder="19:30"
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="venue">Venue</label>
        <input
          id="venue"
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="host">Host</label>
        <input
          id="host"
          type="text"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="capacity">Capacity</label>
        <input
          id="capacity"
          type="number"
          min={1}
          max={400}
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="kind">Kind</label>
        <select
          id="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as EventKind)}
        >
          <option value="dining">Dining</option>
          <option value="social">Social</option>
          <option value="workshop">Workshop</option>
          <option value="excursion">Excursion</option>
          <option value="signature">Signature</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn-olive" disabled={busy}>
        {busy ? "Saving…" : initial ? "Save changes" : "Add event"}
      </button>

      {initial ? (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          onClick={onDelete}
          disabled={busy}
        >
          Remove event
        </button>
      ) : null}
    </form>
  );
}

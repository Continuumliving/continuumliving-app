"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/Toast";
import { deleteClass, deleteEvent, saveClass, saveEvent } from "@/lib/admin-actions";
import type { ClassRow, EventKind, EventRow, Intensity } from "@/lib/types";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function ClassForm({ initial }: { initial?: ClassRow }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    day: initial?.day ?? 1,
    time: initial?.time ?? "07:00",
    title: initial?.title ?? "",
    venue: initial?.venue ?? "",
    intensity: (initial?.intensity ?? "high") as Intensity,
    coach: initial?.coach ?? "",
    duration_min: initial?.duration_min ?? 60,
    capacity: initial?.capacity ?? 20,
    description: initial?.description ?? "",
    active: initial?.active ?? true,
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim() || !f.venue.trim() || !f.coach.trim() || !f.description.trim()) {
      toast("Please complete every field.");
      return;
    }
    if (!TIME_RE.test(f.time)) {
      toast("Time must be HH:MM, e.g. 07:30.");
      return;
    }
    setBusy(true);
    try {
      await saveClass(initial?.id ?? null, {
        ...f,
        title: f.title.trim(),
        venue: f.venue.trim(),
        coach: f.coach.trim(),
        description: f.description.trim(),
      });
      toast(initial ? "Class updated." : "Class added.");
      if (!initial) router.replace("/admin/classes");
      router.refresh();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial) return;
    if (
      !window.confirm(
        "Delete this class permanently? All of its bookings are deleted too. To hide it but keep history, set it to Inactive instead.",
      )
    )
      return;
    setBusy(true);
    try {
      await deleteClass(initial.id);
      toast("Class deleted.");
      router.replace("/admin/classes");
      router.refresh();
    } catch (err) {
      toast((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="bo-form" onSubmit={submit}>
      <div className="bo-field full">
        <label htmlFor="c-title">Title</label>
        <input id="c-title" className="bo-input" value={f.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="c-day">Day</label>
        <select id="c-day" className="bo-select" value={f.day} onChange={(e) => set("day", Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <option key={d} value={d}>
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d]}
            </option>
          ))}
        </select>
      </div>
      <div className="bo-field">
        <label htmlFor="c-time">Start time</label>
        <input id="c-time" type="time" className="bo-input" value={f.time} onChange={(e) => set("time", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="c-coach">Coach</label>
        <input id="c-coach" className="bo-input" value={f.coach} onChange={(e) => set("coach", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="c-venue">Venue</label>
        <input id="c-venue" className="bo-input" value={f.venue} onChange={(e) => set("venue", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="c-int">Intensity</label>
        <select
          id="c-int"
          className="bo-select"
          value={f.intensity}
          onChange={(e) => set("intensity", e.target.value as Intensity)}
        >
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="bo-field">
        <label htmlFor="c-status">Status</label>
        <select
          id="c-status"
          className="bo-select"
          value={f.active ? "1" : "0"}
          onChange={(e) => set("active", e.target.value === "1")}
        >
          <option value="1">Active · visible to residents</option>
          <option value="0">Inactive · hidden</option>
        </select>
      </div>
      <div className="bo-field">
        <label htmlFor="c-dur">Duration (min)</label>
        <input
          id="c-dur"
          type="number"
          min={10}
          max={240}
          className="bo-input"
          value={f.duration_min}
          onChange={(e) => set("duration_min", Number(e.target.value))}
        />
      </div>
      <div className="bo-field">
        <label htmlFor="c-cap">Capacity</label>
        <input
          id="c-cap"
          type="number"
          min={1}
          max={400}
          className="bo-input"
          value={f.capacity}
          onChange={(e) => set("capacity", Number(e.target.value))}
        />
      </div>
      <div className="bo-field full">
        <label htmlFor="c-desc">Description</label>
        <textarea
          id="c-desc"
          rows={4}
          className="bo-textarea"
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="bo-form-actions">
        {initial ? (
          <button type="button" className="bo-btn danger" onClick={remove} disabled={busy}>
            Delete class
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="bo-btn primary" disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Add class"}
        </button>
      </div>
    </form>
  );
}

const KINDS: EventKind[] = ["dining", "social", "workshop", "excursion", "signature"];

export function EventForm({ initial }: { initial?: EventRow }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    date: initial?.date ?? "",
    time: initial?.time ?? "19:00",
    title: initial?.title ?? "",
    venue: initial?.venue ?? "",
    host: initial?.host ?? "",
    capacity: initial?.capacity ?? 24,
    kind: (initial?.kind ?? "dining") as EventKind,
    description: initial?.description ?? "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.date || !f.title.trim() || !f.venue.trim() || !f.host.trim() || !f.description.trim()) {
      toast("Please complete every field.");
      return;
    }
    if (!TIME_RE.test(f.time)) {
      toast("Time must be HH:MM, e.g. 19:30.");
      return;
    }
    setBusy(true);
    try {
      await saveEvent(initial?.id ?? null, {
        ...f,
        title: f.title.trim(),
        venue: f.venue.trim(),
        host: f.host.trim(),
        description: f.description.trim(),
      });
      toast(initial ? "Event updated." : "Event added.");
      if (!initial) router.replace("/admin/events");
      router.refresh();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!initial) return;
    if (!window.confirm("Delete this event? Its guest list is deleted too.")) return;
    setBusy(true);
    try {
      await deleteEvent(initial.id);
      toast("Event deleted.");
      router.replace("/admin/events");
      router.refresh();
    } catch (err) {
      toast((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form className="bo-form" onSubmit={submit}>
      <div className="bo-field full">
        <label htmlFor="e-title">Title</label>
        <input id="e-title" className="bo-input" value={f.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="e-date">Date</label>
        <input id="e-date" type="date" className="bo-input" value={f.date} onChange={(e) => set("date", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="e-time">Time</label>
        <input id="e-time" type="time" className="bo-input" value={f.time} onChange={(e) => set("time", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="e-venue">Venue</label>
        <input id="e-venue" className="bo-input" value={f.venue} onChange={(e) => set("venue", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="e-host">Host</label>
        <input id="e-host" className="bo-input" value={f.host} onChange={(e) => set("host", e.target.value)} />
      </div>
      <div className="bo-field">
        <label htmlFor="e-kind">Type</label>
        <select id="e-kind" className="bo-select" value={f.kind} onChange={(e) => set("kind", e.target.value as EventKind)}>
          {KINDS.map((k) => (
            <option key={k} value={k}>
              {k.charAt(0).toUpperCase() + k.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="bo-field">
        <label htmlFor="e-cap">Capacity</label>
        <input
          id="e-cap"
          type="number"
          min={1}
          max={1000}
          className="bo-input"
          value={f.capacity}
          onChange={(e) => set("capacity", Number(e.target.value))}
        />
      </div>
      <div className="bo-field full">
        <label htmlFor="e-desc">Description</label>
        <textarea
          id="e-desc"
          rows={4}
          className="bo-textarea"
          value={f.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
      <div className="bo-form-actions">
        {initial ? (
          <button type="button" className="bo-btn danger" onClick={remove} disabled={busy}>
            Delete event
          </button>
        ) : (
          <span />
        )}
        <button type="submit" className="bo-btn primary" disabled={busy}>
          {busy ? "Saving…" : initial ? "Save changes" : "Add event"}
        </button>
      </div>
    </form>
  );
}

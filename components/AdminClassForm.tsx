"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import type { ClassRow, Intensity } from "@/lib/types";

interface AdminClassFormProps {
  initial?: ClassRow;
}

export function AdminClassForm({ initial }: AdminClassFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState<number>(initial?.day ?? 1);
  const [time, setTime] = useState<string>(initial?.time ?? "07:00");
  const [title, setTitle] = useState<string>(initial?.title ?? "");
  const [venue, setVenue] = useState<string>(initial?.venue ?? "");
  const [intensity, setIntensity] = useState<Intensity>(
    initial?.intensity ?? "high",
  );
  const [coach, setCoach] = useState<string>(initial?.coach ?? "");
  const [durationMin, setDurationMin] = useState<number>(
    initial?.duration_min ?? 60,
  );
  const [description, setDescription] = useState<string>(
    initial?.description ?? "",
  );
  const [active, setActive] = useState<boolean>(initial?.active ?? true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !venue || !coach || !description) {
      toast("Please complete every field.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const payload = {
        day,
        time,
        title: title.trim(),
        venue: venue.trim(),
        intensity,
        coach: coach.trim(),
        duration_min: durationMin,
        description: description.trim(),
        active,
      };
      if (initial) {
        const { error } = await supabase
          .from("classes")
          .update(payload)
          .eq("id", initial.id);
        if (error) throw error;
        toast("Class updated.");
      } else {
        const { error } = await supabase.from("classes").insert(payload);
        if (error) throw error;
        toast("Class added.");
      }
      router.replace("/admin/classes");
      router.refresh();
    } catch (err) {
      toast((err as Error).message || "We could not save that class.");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!initial) return;
    if (!window.confirm("Retire this class from the programme?")) return;
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", initial.id);
      if (error) throw error;
      toast("Class retired.");
      router.replace("/admin/classes");
      router.refresh();
    } catch (err) {
      toast((err as Error).message || "We could not retire that class.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="field">
        <label htmlFor="day">Day</label>
        <select
          id="day"
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
        >
          <option value={1}>Monday</option>
          <option value={2}>Tuesday</option>
          <option value={3}>Wednesday</option>
          <option value={4}>Thursday</option>
          <option value={5}>Friday</option>
          <option value={6}>Saturday</option>
          <option value={0}>Sunday</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="time">Time (HH:MM)</label>
        <input
          id="time"
          type="text"
          placeholder="07:00"
          value={time}
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
        <label htmlFor="intensity">Intensity</label>
        <select
          id="intensity"
          value={intensity}
          onChange={(e) => setIntensity(e.target.value as Intensity)}
        >
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="coach">Coach</label>
        <input
          id="coach"
          type="text"
          value={coach}
          onChange={(e) => setCoach(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="duration">Duration (minutes)</label>
        <input
          id="duration"
          type="number"
          min={10}
          max={180}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
        />
      </div>
      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="active">Status</label>
        <select
          id="active"
          value={active ? "active" : "inactive"}
          onChange={(e) => setActive(e.target.value === "active")}
        >
          <option value="active">Active · visible to residents</option>
          <option value="inactive">Inactive · hidden</option>
        </select>
      </div>

      <button type="submit" className="btn btn-terracotta" disabled={busy}>
        {busy ? "Saving…" : initial ? "Save changes" : "Add class"}
      </button>

      {initial ? (
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 10 }}
          onClick={onDelete}
          disabled={busy}
        >
          Retire class
        </button>
      ) : null}
    </form>
  );
}

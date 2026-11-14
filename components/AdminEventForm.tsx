"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { ImagePicker } from "./oa/ImagePicker";
import { getBrowserClient } from "@/lib/supabase/client";
import type { EventKind, EventRow } from "@/lib/types";

const KINDS: Array<[EventKind, string]> = [["dining", "Dining"], ["social", "Social"], ["workshop", "Workshop"], ["excursion", "Excursion"], ["signature", "Signature"]];

export function AdminEventForm({ initial }: { initial?: EventRow }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "19:00");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [host, setHost] = useState(initial?.host ?? "Hosted by Continuum");
  const [capacity, setCapacity] = useState(initial?.capacity ?? 12);
  const [kind, setKind] = useState<EventKind>(initial?.kind ?? "social");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? "dinner");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || !venue.trim()) {
      toast("Add a title, date and venue.");
      return;
    }
    setBusy(true);
    const payload = { date, time, title: title.trim(), venue: venue.trim(), host: host.trim(), capacity, kind, description: description.trim(), image };
    const sb = getBrowserClient();
    const { error } = initial
      ? await sb.from("events").update(payload).eq("id", initial.id)
      : await sb.from("events").insert(payload);
    setBusy(false);
    if (error) return toast("Could not save the event.");
    toast(initial ? "Event updated" : "Event added");
    router.replace("/admin/events");
    router.refresh();
  }

  async function remove() {
    if (!initial || !window.confirm("Cancel and remove this event? Reservations for it are removed too.")) return;
    setBusy(true);
    const { error } = await getBrowserClient().from("events").delete().eq("id", initial.id);
    setBusy(false);
    if (error) return toast("Could not remove the event.");
    toast("Event removed");
    router.replace("/admin/events");
    router.refresh();
  }

  return (
    <form className="oa-card oa-form" onSubmit={submit}>
      <label className="oa-label">Title
        <input className="oa-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Resident Dinner" />
      </label>
      <div className="oa-duo">
        <label className="oa-label">Date
          <input className="oa-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="oa-label">Time
          <input className="oa-input" type="time" value={time} onChange={(e) => setTime(e.target.value.slice(0, 5))} />
        </label>
      </div>
      <div className="oa-duo">
        <label className="oa-label">Venue
          <input className="oa-input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Private dining" />
        </label>
        <label className="oa-label">Seats
          <input className="oa-input" type="number" min={1} max={200} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </label>
      </div>
      <label className="oa-label">Host
        <input className="oa-input" value={host} onChange={(e) => setHost(e.target.value)} />
      </label>
      <div className="oa-label">Type
        <div className="oa-seg wrap">
          {KINDS.map(([v, l]) => (
            <button type="button" key={v} className={kind === v ? "on" : ""} onClick={() => setKind(v)}>{l}</button>
          ))}
        </div>
      </div>
      <label className="oa-label">Description
        <textarea className="oa-input" rows={4} maxLength={600} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What residents can expect." />
      </label>
      <div className="oa-label">Photo
        <ImagePicker value={image ?? ""} onChange={setImage} />
      </div>
      <div className="oa-row" style={{ justifyContent: "flex-start", gap: 10 }}>
        <button className="oa-pill gold" type="submit" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add event"}</button>
        {initial && <button className="oa-pill line" type="button" onClick={remove} disabled={busy}>Remove</button>}
      </div>
    </form>
  );
}

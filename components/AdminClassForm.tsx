"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { ImagePicker } from "./oa/ImagePicker";
import { getBrowserClient } from "@/lib/supabase/client";
import { imageSrc } from "@/lib/owners";
import type { ClassRow, Intensity } from "@/lib/types";

const DAYS: Array<[number, string]> = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];

export function AdminClassForm({ initial }: { initial?: ClassRow }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [day, setDay] = useState<number>(initial?.day ?? 1);
  const [time, setTime] = useState(initial?.time ?? "07:00");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [venue, setVenue] = useState(initial?.venue ?? "");
  const [intensity, setIntensity] = useState<Intensity>(initial?.intensity ?? "high");
  const [category, setCategory] = useState(initial?.category ?? "Push");
  const [coach, setCoach] = useState(initial?.coach ?? "Tomash");
  const [duration, setDuration] = useState(initial?.duration_min ?? 60);
  const [capacity, setCapacity] = useState(initial?.capacity ?? 8);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [image, setImage] = useState(initial?.image ?? imageSrc(null, initial?.title ?? "").replace("/img/", "").replace(".webp", ""));
  const [active, setActive] = useState(initial?.active ?? true);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !venue.trim() || !/^\d{2}:\d{2}$/.test(time)) {
      toast("Add a title, venue and time (HH:MM).");
      return;
    }
    setBusy(true);
    const payload = {
      day, time, title: title.trim(), venue: venue.trim(), intensity, category,
      coach: coach.trim() || "Tomash", duration_min: duration, capacity,
      description: description.trim(), image, active,
    };
    const sb = getBrowserClient();
    const { error } = initial
      ? await sb.from("classes").update(payload).eq("id", initial.id)
      : await sb.from("classes").insert(payload);
    setBusy(false);
    if (error) return toast("Could not save the class.");
    toast(initial ? "Class updated" : "Class added");
    router.replace("/admin/classes");
    router.refresh();
  }

  async function remove() {
    if (!initial || !window.confirm("Remove this class from the programme? Existing bookings for it are removed too.")) return;
    setBusy(true);
    const { error } = await getBrowserClient().from("classes").delete().eq("id", initial.id);
    setBusy(false);
    if (error) return toast("Could not remove the class.");
    toast("Class removed");
    router.replace("/admin/classes");
    router.refresh();
  }

  return (
    <form className="oa-card oa-form" onSubmit={submit}>
      <label className="oa-label">Title
        <input className="oa-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. HYROX Training" />
      </label>
      <div className="oa-label">Day
        <div className="oa-seg">
          {DAYS.map(([v, l]) => (
            <button type="button" key={v} className={day === v ? "on" : ""} onClick={() => setDay(v)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="oa-duo">
        <label className="oa-label">Time
          <input className="oa-input" type="time" value={time} onChange={(e) => setTime(e.target.value.slice(0, 5))} />
        </label>
        <label className="oa-label">Duration (min)
          <input className="oa-input" type="number" min={15} max={180} step={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
        </label>
      </div>
      <div className="oa-duo">
        <label className="oa-label">Venue
          <input className="oa-input" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Fitness" />
        </label>
        <label className="oa-label">Places
          <input className="oa-input" type="number" min={1} max={60} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
        </label>
      </div>
      <div className="oa-label">Intensity
        <div className="oa-seg">
          <button type="button" className={intensity === "high" ? "on" : ""} onClick={() => setIntensity("high")}>High</button>
          <button type="button" className={intensity === "low" ? "on" : ""} onClick={() => setIntensity("low")}>Low</button>
        </div>
      </div>
      <div className="oa-label">Category
        <div className="oa-seg">
          {["Push", "Restore", "Explore"].map((c) => (
            <button type="button" key={c} className={category === c ? "on" : ""} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
      </div>
      <label className="oa-label">Coach
        <input className="oa-input" value={coach} onChange={(e) => setCoach(e.target.value)} />
      </label>
      <label className="oa-label">Description
        <textarea className="oa-input" rows={3} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One or two sentences residents see on the class card." />
      </label>
      <div className="oa-label">Photo
        <ImagePicker value={image ?? ""} onChange={setImage} />
      </div>
      <label className="oa-check">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        <span>Visible in the app</span>
      </label>
      <div className="oa-row" style={{ justifyContent: "flex-start", gap: 10 }}>
        <button className="oa-pill gold" type="submit" disabled={busy}>{busy ? "Saving…" : initial ? "Save changes" : "Add class"}</button>
        {initial && <button className="oa-pill line" type="button" onClick={remove} disabled={busy}>Remove</button>}
      </div>
    </form>
  );
}

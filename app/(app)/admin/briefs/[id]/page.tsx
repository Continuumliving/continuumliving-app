"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/Toast";
import { Sparkline } from "@/components/oa/Sparkline";
import { getBrowserClient } from "@/lib/supabase/client";
import { madridDateOffsetISO } from "@/lib/dates";
import {
  METRICS, METRIC_ORDER, addMonthsISO, fetchResidentBrief, fmtDate, fmtValue, monthLabel, summarise, thisMonthStart,
  type MetricKind,
} from "@/lib/brief";

function addMonths(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + n, d, 12));
  return dt.toISOString().slice(0, 10);
}

export default function AdminResidentBrief({ params }: { params: { id: string } }) {
  const rid = params.id;
  const toast = useToast();
  const sb = getBrowserClient();
  const { data: person } = useSWR(`person:${rid}`, async () => {
    const { data } = await sb.from("profiles").select("id, first_name, last_name, unit_number, email").eq("id", rid).maybeSingle();
    return data;
  });
  const { data, mutate, error } = useSWR(`brief:${rid}`, () => fetchResidentBrief(sb, rid), { revalidateOnMount: true, revalidateIfStale: true });

  const thisWs = thisMonthStart();
  const [ws, setWs] = useState(thisWs);
  const current = useMemo(() => data?.briefs.find((b) => b.week_start === ws), [data, ws]);
  const [note, setNote] = useState("");
  const [focus, setFocus] = useState("");
  useEffect(() => {
    setNote(current?.note ?? "");
    setFocus(current?.focus ?? "");
  }, [current?.id, current?.updated_at, ws]); // eslint-disable-line react-hooks/exhaustive-deps

  const [goal, setGoal] = useState("");
  const [intake, setIntake] = useState("");
  const [review, setReview] = useState("");
  const [cnotes, setCnotes] = useState("");
  useEffect(() => {
    if (!data) return;
    setGoal(data.profile.goal ?? "");
    setIntake(data.profile.intake_date ?? "");
    setReview(data.profile.next_review ?? "");
    setCnotes(data.profile.coach_notes ?? "");
  }, [data?.profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const [kind, setKind] = useState<MetricKind>("avg_hr");
  const [val, setVal] = useState("");
  const [on, setOn] = useState(madridDateOffsetISO(0));
  const [busy, setBusy] = useState<string | null>(null);

  const name = person ? `${person.first_name} ${person.last_name}`.trim() : "Resident";
  const consent = !!data?.profile.consent_at;
  const summary = data ? summarise(data.metrics) : [];

  async function saveBrief(publish: boolean | null) {
    setBusy("brief");
    const willPublish = publish === null ? !!current?.published : publish;
    const { error: e } = await sb.from("weekly_briefs").upsert(
      {
        resident_id: rid,
        week_start: ws,
        note: note.trim(),
        focus: focus.trim(),
        published: willPublish,
        published_at: willPublish ? current?.published_at ?? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resident_id,week_start" },
    );
    setBusy(null);
    if (e) return toast("Could not save the brief");
    await mutate();
    if (publish === true && !current?.published) {
      fetch("/api/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ residentId: rid, kind: "brief", preview: note.slice(0, 120) }) }).catch(() => {});
      toast(`Published for ${person?.first_name ?? "resident"}`);
    } else toast(publish === false ? "Unpublished" : "Saved");
  }

  async function saveProfile() {
    setBusy("profile");
    const { error: e } = await sb.from("health_profiles").upsert(
      {
        resident_id: rid,
        goal: goal.trim() || null,
        intake_date: intake || null,
        next_review: review || null,
        coach_notes: cnotes.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "resident_id" },
    );
    setBusy(null);
    if (e) return toast("Could not save");
    await mutate();
    toast("Saved");
  }

  async function addMetric(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(val.replace(",", "."));
    if (!v || v <= 0) return toast("Enter a value");
    setBusy("metric");
    const { error: err } = await sb.from("health_metrics").insert({ resident_id: rid, kind, value: v, measured_on: on });
    setBusy(null);
    if (err) return toast(consent ? "Could not add the measurement" : "Consent is needed first");
    setVal("");
    await mutate();
    toast("Measurement added");
  }

  async function delMetric(id: string) {
    if (!window.confirm("Delete this measurement?")) return;
    await sb.from("health_metrics").delete().eq("id", id);
    await mutate();
  }

  const weeks = Array.from(new Set([thisWs, addMonthsISO(thisWs, -1), ...(data?.briefs.map((b) => b.week_start) ?? [])])).sort().reverse();

  return (
    <main className="oa">
      <Link href="/admin/briefs" className="oa-back">‹ All briefs</Link>
      <div className="oa-head">
        <div style={{ minWidth: 0 }}>
          <div className="oa-eyebrow">Health brief</div>
          <h1 className="oa-h1" style={{ fontSize: 32 }}>{name}</h1>
          <div className="oa-sub" style={{ marginTop: 4 }}>
            {person?.unit_number && person.unit_number !== "—" ? `Residence ${person.unit_number} · ` : ""}
            <span style={{ color: consent ? "var(--ok)" : "#9a5b4e" }}>{consent ? "Consent given" : "No consent yet"}</span>
          </div>
        </div>
        <Link href={`/admin/messages/${rid}`} className="oa-pill line">Message</Link>
      </div>
      {error && <div className="oa-card oa-empty"><p>Could not load. Has migration 0009 been run in Supabase?</p></div>}

      {/* weekly brief */}
      <section className="oa-card oa-form">
        <div className="oa-row">
          <div className="oa-eyebrow">Monthly brief</div>
          <select className="oa-input oa-select" value={ws} onChange={(e) => setWs(e.target.value)} aria-label="Month">
            {weeks.map((w) => <option key={w} value={w}>{w === thisWs ? `This month · ${monthLabel(w)}` : monthLabel(w)}</option>)}
          </select>
        </div>
        <label className="oa-label">How the month went
          <textarea className="oa-input" rows={6} maxLength={4000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sessions, effort, energy, what went well." />
        </label>
        <label className="oa-label">Points to improve
          <textarea className="oa-input" rows={3} maxLength={1000} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="One or two clear points for next month." />
        </label>
        <div className="oa-row" style={{ justifyContent: "flex-start", gap: 10, flexWrap: "wrap" }}>
          {current?.published ? (
            <>
              <button className="oa-pill gold" onClick={() => saveBrief(null)} disabled={busy === "brief"}>Save changes</button>
              <button className="oa-pill line" onClick={() => saveBrief(false)} disabled={busy === "brief"}>Unpublish</button>
              <span className="oa-meta">Published · visible to {person?.first_name ?? "resident"}</span>
            </>
          ) : (
            <>
              <button className="oa-pill gold" onClick={() => saveBrief(true)} disabled={busy === "brief" || !note.trim()}>Publish</button>
              <button className="oa-pill line" onClick={() => saveBrief(false)} disabled={busy === "brief"}>Save draft</button>
              <span className="oa-meta">{current ? "Draft · not visible yet" : "Not started"}</span>
            </>
          )}
        </div>
      </section>

      {/* measurements */}
      <section className="oa-card oa-form">
        <div className="oa-eyebrow">Measurements</div>
        {!consent ? (
          <p className="oa-note" style={{ marginTop: 0 }}>
            {person?.first_name ?? "The resident"} has not given consent yet. They accept in the Brief tab of their app; after that you can record measurements here.
          </p>
        ) : (
          <form onSubmit={addMetric} className="oa-metric-form">
            <select className="oa-input oa-select" value={kind} onChange={(e) => setKind(e.target.value as MetricKind)} aria-label="Measurement">
              {METRIC_ORDER.map((k) => <option key={k} value={k}>{METRICS[k].label} ({METRICS[k].unit})</option>)}
            </select>
            <input className="oa-input" inputMode="decimal" placeholder="Value" value={val} onChange={(e) => setVal(e.target.value)} aria-label="Value" />
            <input className="oa-input" type="date" value={on} onChange={(e) => setOn(e.target.value)} aria-label="Date" />
            <button className="oa-pill solid" type="submit" disabled={busy === "metric"}>Add</button>
          </form>
        )}
        {summary.length > 0 && (
          <div>
            {summary.map((s) => (
              <details key={s.kind} className="oa-metric">
                <summary>
                  <span style={{ flex: 1 }}>{s.def.label}</span>
                  <Sparkline values={s.series} good={s.good} />
                  <b>{fmtValue(Number(s.last.value))} {s.def.unit}</b>
                </summary>
                {data!.metrics.filter((m) => m.kind === s.kind).slice().reverse().map((m) => (
                  <div key={m.id} className="oa-row oa-meta" style={{ padding: "6px 0" }}>
                    <span>{fmtDate(m.measured_on)}</span>
                    <span>{fmtValue(Number(m.value))} {s.def.unit} <button className="oa-del" onClick={() => delMetric(m.id)} aria-label="Delete">×</button></span>
                  </div>
                ))}
              </details>
            ))}
          </div>
        )}
      </section>

      {/* profile */}
      <section className="oa-card oa-form">
        <div className="oa-eyebrow">Programme</div>
        <label className="oa-label">Goal (visible to resident)
          <input className="oa-input" maxLength={300} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Stronger legs by 15 December" />
        </label>
        <div className="oa-duo">
          <label className="oa-label">Intake date
            <input className="oa-input" type="date" value={intake} onChange={(e) => setIntake(e.target.value)} />
          </label>
          <label className="oa-label">Next review
            <input className="oa-input" type="date" value={review} onChange={(e) => setReview(e.target.value)} />
          </label>
        </div>
        {intake && !review && <button type="button" className="oa-link" onClick={() => setReview(addMonths(intake, 3))}>Set review three months after intake</button>}
        <label className="oa-label">Private notes (only you see these)
          <textarea className="oa-input" rows={4} maxLength={4000} value={cnotes} onChange={(e) => setCnotes(e.target.value)} placeholder="Injuries, preferences, context." />
        </label>
        <button className="oa-pill gold" style={{ alignSelf: "flex-start" }} onClick={saveProfile} disabled={busy === "profile"}>Save</button>
      </section>
    </main>
  );
}


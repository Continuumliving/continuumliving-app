"use client";

import { useState } from "react";
import useSWR from "swr";
import { Sparkline } from "@/components/oa/Sparkline";
import { useBookings, useClasses, useProfile } from "@/lib/data-context";
import { madridDateOffsetISO } from "@/lib/dates";
import { fetchMyBrief, fmtDate, fmtValue, summarise, thisWeekStart, weekLabel } from "@/lib/brief";
import { getBrowserClient } from "@/lib/supabase/client";

const DOW = ["M", "T", "W", "T", "F", "S", "S"];

export default function BriefPage() {
  const profile = useProfile();
  const classes = useClasses();
  const bookings = useBookings();
  const { data, error, mutate, isLoading } = useSWR("continuum:brief", () => fetchMyBrief(getBrowserClient()), {
    revalidateOnMount: true,
    revalidateIfStale: true,
  });
  const [busy, setBusy] = useState(false);
  const [openPast, setOpenPast] = useState<string | null>(null);
  if (!profile) return null;

  const ws = thisWeekStart();
  const today = madridDateOffsetISO(0);
  const monOffset = Math.round((Date.parse(`${ws}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 864e5);
  const week = Array.from({ length: 7 }, (_, i) => madridDateOffsetISO(monOffset + i));
  const byId = new Map(classes.map((c) => [c.id, c]));
  const mine = bookings.filter((b) => week.includes(b.session_date) && byId.has(b.class_id));
  const hi = mine.filter((b) => byId.get(b.class_id)!.intensity === "high").length;
  const lo = mine.length - hi;
  const balance = mine.length === 0 ? "—" : hi > 0 && lo > 0 && Math.abs(hi - lo) <= 2 ? "Ideal" : hi > lo ? "Push-heavy" : "Recovery-heavy";
  const load = week.map((iso) => {
    const day = mine.filter((b) => b.session_date === iso).map((b) => byId.get(b.class_id)!);
    const h = day.filter((c) => c.intensity === "high").length;
    return { h, l: day.length - h };
  });
  const maxLoad = Math.max(1, ...load.map((x) => x.h * 2 + x.l));
  const joined = new Date(profile.joined_at);
  const weekNo = Math.max(1, Math.floor((Date.now() - joined.getTime()) / (7 * 864e5)) + 1);

  const consent = !!data?.profile.consent_at;
  const latest = data?.briefs[0];
  const past = data?.briefs.slice(1) ?? [];
  const summary = data ? summarise(data.metrics) : [];

  async function giveConsent() {
    setBusy(true);
    await getBrowserClient().rpc("give_health_consent");
    await mutate();
    setBusy(false);
  }
  async function withdraw() {
    if (!window.confirm("Withdraw consent? Your recorded measurements will be deleted. Your coach's weekly notes stay.")) return;
    setBusy(true);
    await getBrowserClient().rpc("withdraw_health_consent");
    await mutate();
    setBusy(false);
  }

  return (
    <main className="oa">
      <div>
        <div className="oa-eyebrow">Personal Health Brief</div>
        <h1 className="oa-h1">Week {weekNo}</h1>
        <div className="oa-sub" style={{ marginTop: 4 }}>{weekLabel(ws)}</div>
      </div>

      {data && !consent && (
        <div className="oa-card oa-empty" style={{ gap: 12 }}>
          <div className="oa-eyebrow">Your consent</div>
          <p>
            To personalise your programme, your coach records your heart rate during sessions, your weight and body
            fat percentage. They are visible only to you and your coach, are never shared with the building or the
            developer, and you can delete them at any time here.
          </p>
          <button className="oa-pill gold" style={{ alignSelf: "flex-start", padding: "11px 18px" }} onClick={giveConsent} disabled={busy}>
            {busy ? "…" : "I agree"}
          </button>
        </div>
      )}

      <article className="oa-card" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="oa-eyebrow" style={{ color: "var(--mute)" }}>This week</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, borderBottom: "1px solid var(--line)", paddingBottom: 16, marginTop: -8 }}>
          <div><div className="oa-k">SESSIONS</div><div className="oa-kv-big">{mine.length}<small> / 5</small></div></div>
          <div><div className="oa-k">HIGH · LOW</div><div className="oa-kv-big">{hi}<small> · {lo}</small></div></div>
          <div><div className="oa-k">BALANCE</div><div className="oa-kv-big" style={{ fontSize: balance.length > 6 ? 20 : 30, marginTop: balance.length > 6 ? 10 : 4, lineHeight: 1.15 }}>{balance}</div></div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 110, borderBottom: "1px solid var(--line)" }}>
            {load.map((x, i) => {
              const v = x.h * 2 + x.l;
              return <div key={i} style={{ flex: 1, height: `${v === 0 ? 3 : Math.max(18, (v / maxLoad) * 100)}%`, borderRadius: "4px 4px 0 0", background: v === 0 ? "var(--line)" : x.h > 0 ? "var(--gold)" : "var(--lo)" }} />;
            })}
          </div>
          <div style={{ display: "flex", gap: 10, fontSize: 11, letterSpacing: ".08em", color: "var(--mute)", marginTop: 6 }}>
            {DOW.map((dd, i) => <span key={i} style={{ flex: 1, textAlign: "center" }}>{dd}</span>)}
          </div>
        </div>
      </article>

      <article className="oa-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="oa-av" src="/img/coach.jpg" alt="" />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="oa-eyebrow">Coach&rsquo;s note{latest ? ` · ${latest.week_start === ws ? "this week" : weekLabel(latest.week_start)}` : ""}</div>
            <p className="oa-note">
              {isLoading ? "…" : latest?.note || "Each week your coach writes how your week went and what to improve. Your first note follows your intake."}
            </p>
            {latest?.focus && (
              <div className="oa-focus">
                <div className="oa-eyebrow" style={{ color: "var(--mute)" }}>Points to improve</div>
                <p className="oa-note" style={{ marginTop: 6 }}>{latest.focus}</p>
              </div>
            )}
          </div>
        </div>
      </article>

      {consent && summary.length > 0 && (
        <>
          <div className="oa-sec"><h2 className="oa-h2">Your measurements</h2><span className="oa-sub">since intake</span></div>
          <div className="oa-card oa-list">
            {summary.map((s) => (
              <div className="oa-li" key={s.kind}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{s.def.label}</div>
                  <div className="oa-meta">{s.count > 1 ? `from ${fmtValue(Number(s.first.value))} on ${fmtDate(s.first.measured_on)}` : `measured ${fmtDate(s.last.measured_on)}`}</div>
                </div>
                <Sparkline values={s.series} good={s.good} />
                <div style={{ textAlign: "right", minWidth: 78 }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1 }}>{fmtValue(Number(s.last.value))}<small style={{ fontFamily: "var(--sans)", fontSize: 12, color: "var(--mute)" }}> {s.def.unit}</small></div>
                  {s.count > 1 && s.delta !== 0 && (
                    <div style={{ fontSize: 12, marginTop: 3, color: s.good === null ? "var(--mute)" : s.good ? "var(--gold-d)" : "#9a5b4e" }}>
                      {s.delta > 0 ? "▲" : "▼"} {fmtValue(Math.abs(s.delta))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {data && (data.profile.goal || data.profile.next_review || data.profile.intake_date) && (
        <div className="oa-card oa-list">
          {data.profile.goal && <div className="oa-kv"><span>Your goal</span><span>{data.profile.goal}</span></div>}
          {data.profile.intake_date && <div className="oa-kv"><span>Intake</span><span>{fmtDate(data.profile.intake_date)}</span></div>}
          {data.profile.next_review && <div className="oa-kv"><span>Next review</span><span style={{ color: "var(--gold-d)" }}>{fmtDate(data.profile.next_review)}</span></div>}
        </div>
      )}

      {past.length > 0 && (
        <>
          <div className="oa-sec"><h2 className="oa-h2">Earlier briefs</h2></div>
          <div className="oa-card oa-list">
            {past.map((b) => (
              <div key={b.id} className="oa-li" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                <button className="oa-row" onClick={() => setOpenPast(openPast === b.id ? null : b.id)} aria-expanded={openPast === b.id}>
                  <span style={{ fontWeight: 500 }}>{weekLabel(b.week_start)}</span>
                  <span className="oa-meta">{openPast === b.id ? "Close" : "Read"}</span>
                </button>
                {openPast === b.id && (
                  <>
                    <p className="oa-note" style={{ margin: 0 }}>{b.note}</p>
                    {b.focus && <p className="oa-note" style={{ margin: 0, color: "var(--mute)" }}>To improve: {b.focus}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {error && <div className="oa-sub" style={{ textAlign: "center" }}>Your brief could not be loaded just now.</div>}

      {consent && (
        <button className="oa-withdraw" onClick={withdraw} disabled={busy}>
          Withdraw consent and delete my measurements
        </button>
      )}
    </main>
  );
}

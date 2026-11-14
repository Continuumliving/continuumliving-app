"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { useToast } from "@/components/Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import { madridDateOffsetISO } from "@/lib/dates";
import type { BookingRow, ClassRow } from "@/lib/types";

const SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface Person { id: string; first_name: string; last_name: string; unit_number: string }

export default function AttendancePage() {
  const toast = useToast();
  const sb = getBrowserClient();
  const days = useMemo(
    () => Array.from({ length: 8 }, (_, i) => {
      const iso = madridDateOffsetISO(-i);
      const wd = new Date(`${iso}T12:00:00Z`).getUTCDay();
      return { iso, wd, short: SHORT[wd], n: Number(iso.slice(8, 10)) };
    }),
    [],
  );
  const [sel, setSel] = useState(0);
  const day = days[sel];

  const { data, mutate } = useSWR(`attendance:${day.iso}`, async () => {
    const [c, b] = await Promise.all([
      sb.from("classes").select("*").eq("day", day.wd).order("time"),
      sb.from("bookings").select("*").eq("session_date", day.iso),
    ]);
    const bookings = (b.data ?? []) as BookingRow[];
    const ids = Array.from(new Set(bookings.map((x) => x.profile_id)));
    const p = ids.length ? await sb.from("profiles").select("id, first_name, last_name, unit_number").in("id", ids) : { data: [] };
    return {
      classes: (c.data ?? []) as ClassRow[],
      bookings,
      people: new Map(((p.data ?? []) as Person[]).map((x) => [x.id, x])),
      failed: !!(c.error || b.error),
    };
  }, { revalidateOnMount: true, revalidateIfStale: true });

  async function mark(b: BookingRow, value: boolean) {
    const next = b.attended === value ? null : value;
    mutate((d) => d && { ...d, bookings: d.bookings.map((x) => (x.id === b.id ? { ...x, attended: next } : x)) }, { revalidate: false });
    const { error } = await sb.from("bookings").update({ attended: next, attended_at: next === null ? null : new Date().toISOString() }).eq("id", b.id);
    if (error) {
      toast("Could not save. Has migration 0010 been run?");
      mutate();
    }
  }

  async function markAll(classId: string) {
    const list = (data?.bookings ?? []).filter((b) => b.class_id === classId && b.attended == null);
    if (!list.length) return;
    mutate((d) => d && { ...d, bookings: d.bookings.map((x) => (list.some((l) => l.id === x.id) ? { ...x, attended: true } : x)) }, { revalidate: false });
    const { error } = await sb.from("bookings").update({ attended: true, attended_at: new Date().toISOString() }).in("id", list.map((l) => l.id));
    if (error) {
      toast("Could not save.");
      mutate();
    }
  }

  const total = data?.bookings.length ?? 0;
  const came = data?.bookings.filter((b) => b.attended === true).length ?? 0;
  const open = data?.bookings.filter((b) => b.attended == null).length ?? 0;

  return (
    <main className="oa">
      <Link href="/admin" className="oa-back">‹ Admin</Link>
      <div>
        <div className="oa-eyebrow">Attendance</div>
        <h1 className="oa-h1">Who was there</h1>
        <div className="oa-sub" style={{ marginTop: 4 }}>
          {total === 0 ? "No bookings on this day" : `${came} of ${total} attended${open ? ` · ${open} to mark` : ""}`}
        </div>
      </div>

      <div className="oa-days" style={{ gridTemplateColumns: "repeat(8,1fr)" }}>
        {days.map((d, i) => (
          <button key={d.iso} className="oa-day" aria-pressed={i === sel} onClick={() => setSel(i)}>
            <div className="d">{i === 0 ? "TODAY" : d.short}</div>
            <div className="n">{d.n}</div>
          </button>
        ))}
      </div>

      {data?.failed && <div className="oa-card oa-empty"><p>Could not load this day.</p></div>}
      {data && data.classes.length === 0 && <div className="oa-card oa-empty"><p>No classes on this day.</p></div>}

      {data?.classes.map((c) => {
        const list = data.bookings.filter((b) => b.class_id === c.id);
        return (
          <section key={c.id} className="oa-card" style={{ padding: "16px 16px 6px" }}>
            <div className="oa-row" style={{ marginBottom: 6 }}>
              <div>
                <div className="oa-meta">{c.time} · {c.venue}</div>
                <div style={{ fontSize: 17, fontWeight: 500, marginTop: 2 }}>{c.title}</div>
              </div>
              {list.some((b) => b.attended == null) && <button className="oa-pill line" onClick={() => markAll(c.id)}>All attended</button>}
            </div>
            {list.length === 0 && <div className="oa-meta" style={{ padding: "8px 0 12px" }}>No bookings.</div>}
            {list.map((b) => {
              const p = data.people.get(b.profile_id);
              return (
                <div key={b.id} className="oa-li">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{p ? `${p.first_name} ${p.last_name}` : "Resident"}</div>
                    <div className="oa-meta">{p?.unit_number && p.unit_number !== "—" ? `Residence ${p.unit_number} · ` : ""}{b.attended === true ? "Attended" : b.attended === false ? "No-show" : "Not marked"}</div>
                  </div>
                  <div className="oa-att">
                    <button className={`yes${b.attended === true ? " on" : ""}`} onClick={() => mark(b, true)} aria-label="Attended">✓</button>
                    <button className={`no${b.attended === false ? " on" : ""}`} onClick={() => mark(b, false)} aria-label="No-show">✕</button>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </main>
  );
}

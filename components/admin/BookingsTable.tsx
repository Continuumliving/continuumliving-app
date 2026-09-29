"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CancelBookingButton } from "@/components/admin/AdminActions";
import { downloadCsv } from "@/lib/admin-actions";
import { formatStamp, toCsv } from "@/lib/admin-format";
import { formatShortDate } from "@/lib/dates";

export interface BookingLine {
  id: string;
  profile_id: string;
  class_id: string;
  session_date: string;
  created_at: string;
  name: string;
  email: string;
  unit: string;
  classTitle: string;
  time: string;
  coach: string;
  venue: string;
}

export function BookingsTable({
  rows,
  today,
  classes,
}: {
  rows: BookingLine[];
  today: string;
  classes: Array<{ id: string; label: string }>;
}) {
  const [when, setWhen] = useState<"upcoming" | "past" | "all">("upcoming");
  const [classId, setClassId] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => (when === "upcoming" ? r.session_date >= today : when === "past" ? r.session_date < today : true))
      .filter((r) => !classId || r.class_id === classId)
      .filter((r) => !needle || [r.name, r.email, r.unit, r.classTitle].some((v) => v.toLowerCase().includes(needle)))
      .sort((a, b) => {
        const ka = a.session_date + a.time;
        const kb = b.session_date + b.time;
        return when === "upcoming" ? ka.localeCompare(kb) : kb.localeCompare(ka);
      });
  }, [rows, when, classId, q, today]);

  function exportCsv() {
    downloadCsv(
      `continuum-bookings-${today}.csv`,
      toCsv(
        ["Date", "Time", "Class", "Coach", "Venue", "Resident", "Email", "Unit", "Booked at"],
        filtered.map((r) => [r.session_date, r.time, r.classTitle, r.coach, r.venue, r.name, r.email, r.unit, r.created_at]),
      ),
    );
  }

  return (
    <section className="bo-panel">
      <div className="bo-toolbar">
        <div className="bo-seg" role="group" aria-label="When">
          {(["upcoming", "past", "all"] as const).map((w) => (
            <button key={w} type="button" className={when === w ? "on" : ""} onClick={() => setWhen(w)}>
              {w === "upcoming" ? "Upcoming" : w === "past" ? "Past" : "All"}
            </button>
          ))}
        </div>
        <select className="bo-select" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Class">
          <option value="">All classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          className="bo-input search"
          type="search"
          placeholder="Search resident or class"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search bookings"
        />
        <span className="grow" />
        <button type="button" className="bo-btn" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bo-empty">No bookings match.</div>
      ) : (
        <div className="bo-table-wrap">
          <table className="bo-table">
            <thead>
              <tr>
                <th>Session</th>
                <th>Class</th>
                <th>Resident</th>
                <th className="hide-sm">Unit</th>
                <th className="hide-sm">Booked</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {formatShortDate(r.session_date)} · {r.time}
                  </td>
                  <td>
                    <Link href={`/admin/classes/${r.class_id}?date=${r.session_date}`}>{r.classTitle}</Link>
                    <div className="muted" style={{ fontSize: 12, color: "var(--stone-deep)" }}>
                      {r.coach}
                    </div>
                  </td>
                  <td>
                    <Link href={`/admin/residents/${r.profile_id}`}>{r.name}</Link>
                  </td>
                  <td className="muted hide-sm">{r.unit || "—"}</td>
                  <td className="muted hide-sm">{formatStamp(r.created_at)}</td>
                  <td className="num">
                    {r.session_date >= today ? <CancelBookingButton booking={r} who={r.name} /> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="bo-foot">
        {filtered.length} {filtered.length === 1 ? "booking" : "bookings"}
      </div>
    </section>
  );
}

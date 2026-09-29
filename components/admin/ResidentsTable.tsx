"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/admin-actions";
import { formatDay, initials, toCsv } from "@/lib/admin-format";
import type { Role } from "@/lib/types";

export interface ResidentSummary {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  unit_number: string;
  role: Role;
  joined_at: string;
  upcoming: number;
  sessions: number;
  rsvps: number;
  lastActive: string | null;
}

type SortKey = "joined" | "name" | "unit" | "sessions" | "active";

export function ResidentsTable({ rows }: { rows: ResidentSummary[] }) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"all" | Role>("all");
  const [sort, setSort] = useState<SortKey>("joined");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (role !== "all" && r.role !== role) return false;
      if (!needle) return true;
      return [r.name, r.email, r.unit_number].some((v) => v.toLowerCase().includes(needle));
    });
    const by: Record<SortKey, (a: ResidentSummary, b: ResidentSummary) => number> = {
      joined: (a, b) => b.joined_at.localeCompare(a.joined_at),
      name: (a, b) => a.name.localeCompare(b.name),
      unit: (a, b) => a.unit_number.localeCompare(b.unit_number, undefined, { numeric: true }),
      sessions: (a, b) => b.sessions - a.sessions,
      active: (a, b) => (b.lastActive ?? "").localeCompare(a.lastActive ?? ""),
    };
    return [...list].sort(by[sort]);
  }, [rows, q, role, sort]);

  function exportCsv() {
    const csv = toCsv(
      ["First name", "Last name", "Email", "Unit", "Role", "Joined", "Upcoming bookings", "Total bookings", "Event RSVPs", "Last active"],
      filtered.map((r) => [
        r.first_name,
        r.last_name,
        r.email,
        r.unit_number,
        r.role,
        r.joined_at.slice(0, 10),
        r.upcoming,
        r.sessions,
        r.rsvps,
        r.lastActive ? r.lastActive.slice(0, 10) : "",
      ]),
    );
    downloadCsv(`continuum-residents-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  }

  return (
    <section className="bo-panel">
      <div className="bo-toolbar">
        <input
          className="bo-input search"
          type="search"
          placeholder="Search name, email or unit"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search residents"
        />
        <div className="bo-seg" role="group" aria-label="Role">
          {(["all", "user", "admin"] as const).map((r) => (
            <button key={r} type="button" className={role === r ? "on" : ""} onClick={() => setRole(r)}>
              {r === "all" ? "All" : r === "user" ? "Residents" : "Admins"}
            </button>
          ))}
        </div>
        <select
          className="bo-select"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort"
        >
          <option value="joined">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="unit">Unit</option>
          <option value="sessions">Most bookings</option>
          <option value="active">Recently active</option>
        </select>
        <span className="grow" />
        <button type="button" className="bo-btn" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bo-empty">{rows.length === 0 ? "No residents yet." : "No residents match."}</div>
      ) : (
        <div className="bo-table-wrap">
          <table className="bo-table">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Unit</th>
                <th className="hide-sm">Joined</th>
                <th className="num">Upcoming</th>
                <th className="num hide-sm">Bookings</th>
                <th className="num hide-sm">RSVPs</th>
                <th className="hide-sm">Last active</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={`/admin/residents/${r.id}`} className="bo-person">
                      <span className="bo-avatar">
                        {initials({ first_name: r.first_name, last_name: r.last_name })}
                      </span>
                      <span>
                        <span className="name">{r.name}</span>{" "}
                        {r.role === "admin" ? <span className="bo-tag admin">Admin</span> : null}
                        <br />
                        <span className="email">{r.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td>{r.unit_number || "—"}</td>
                  <td className="muted hide-sm">{formatDay(r.joined_at)}</td>
                  <td className="num">{r.upcoming}</td>
                  <td className="num hide-sm">{r.sessions}</td>
                  <td className="num hide-sm">{r.rsvps}</td>
                  <td className="muted hide-sm">{r.lastActive ? formatDay(r.lastActive) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="bo-foot">
        Showing {filtered.length} of {rows.length}
      </div>
    </section>
  );
}

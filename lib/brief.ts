import type { SupabaseClient } from "@supabase/supabase-js";
import { madridDateOffsetISO, todayMadridISO } from "./dates";

export type MetricKind = "avg_hr" | "max_hr" | "weight" | "body_fat";

export const METRICS: Record<MetricKind, { label: string; unit: string; better: "up" | "down" | "none" }> = {
  avg_hr: { label: "Average heart rate", unit: "bpm", better: "none" },
  max_hr: { label: "Maximum heart rate", unit: "bpm", better: "none" },
  weight: { label: "Weight", unit: "kg", better: "none" },
  body_fat: { label: "Body fat", unit: "%", better: "down" },
};
export const METRIC_ORDER = Object.keys(METRICS) as MetricKind[];

export interface HealthProfile {
  resident_id?: string;
  consent_at: string | null;
  goal: string | null;
  intake_date: string | null;
  next_review: string | null;
  coach_notes?: string | null;
}
export interface Metric {
  id: string;
  resident_id: string;
  kind: MetricKind;
  value: number;
  measured_on: string;
  note: string | null;
}
export interface WeeklyBrief {
  id: string;
  resident_id: string;
  week_start: string;
  note: string;
  focus: string;
  published: boolean;
  published_at: string | null;
  updated_at: string;
}

/** First day of the current Madrid month (briefs are monthly; stored in week_start). */
export function thisMonthStart(): string {
  return `${todayMadridISO().slice(0, 7)}-01`;
}

export function addMonthsISO(iso: string, n: number): string {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  return d.toISOString().slice(0, 10);
}

export function monthLabel(monthStart: string): string {
  const [y, m] = monthStart.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1, 12)));
}

/** Monday of the current Madrid week. */
export function thisWeekStart(): string {
  const iso = todayMadridISO();
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  return madridDateOffsetISO(-((wd + 6) % 7));
}

export function weekLabel(weekStart: string): string {
  const [y, m, d] = weekStart.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d, 12));
  const end = new Date(start.getTime() + 6 * 864e5);
  const f = (x: Date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(x);
  return `${f(start)} – ${f(end)}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d, 12)),
  );
}

export function fmtValue(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** First and latest value per metric kind. */
export function summarise(metrics: Metric[]) {
  const by = new Map<MetricKind, Metric[]>();
  for (const m of metrics) {
    const arr = by.get(m.kind) ?? [];
    arr.push(m);
    by.set(m.kind, arr);
  }
  return METRIC_ORDER.filter((k) => by.has(k)).map((k) => {
    const arr = by.get(k)!.sort((a, b) => a.measured_on.localeCompare(b.measured_on));
    const first = arr[0];
    const last = arr[arr.length - 1];
    const delta = arr.length > 1 ? Number(last.value) - Number(first.value) : 0;
    const def = METRICS[k];
    const good = delta === 0 || def.better === "none" ? null : (def.better === "up") === delta > 0;
    return { kind: k, def, first, last, delta, good, count: arr.length, series: arr.map((x) => Number(x.value)) };
  });
}

/* ---------- resident ---------- */

export async function fetchMyBrief(sb: SupabaseClient) {
  const [p, m, b] = await Promise.all([
    sb.rpc("my_health_profile"),
    sb.from("health_metrics").select("*").order("measured_on", { ascending: true }),
    sb.from("weekly_briefs").select("*").eq("published", true).order("week_start", { ascending: false }).limit(52),
  ]);
  if (p.error || m.error || b.error) throw p.error || m.error || b.error;
  const prof = (Array.isArray(p.data) ? p.data[0] : p.data) as HealthProfile | undefined;
  return {
    profile: prof ?? { consent_at: null, goal: null, intake_date: null, next_review: null },
    metrics: (m.data ?? []) as Metric[],
    briefs: (b.data ?? []) as WeeklyBrief[],
  };
}

/* ---------- coach ---------- */

export async function fetchResidentBrief(sb: SupabaseClient, residentId: string) {
  const [p, m, b] = await Promise.all([
    sb.from("health_profiles").select("*").eq("resident_id", residentId).maybeSingle(),
    sb.from("health_metrics").select("*").eq("resident_id", residentId).order("measured_on", { ascending: true }),
    sb.from("weekly_briefs").select("*").eq("resident_id", residentId).order("week_start", { ascending: false }).limit(52),
  ]);
  if (p.error || m.error || b.error) throw p.error || m.error || b.error;
  return {
    profile: (p.data as HealthProfile | null) ?? { resident_id: residentId, consent_at: null, goal: null, intake_date: null, next_review: null, coach_notes: null },
    metrics: (m.data ?? []) as Metric[],
    briefs: (b.data ?? []) as WeeklyBrief[],
  };
}

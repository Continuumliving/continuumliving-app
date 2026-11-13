import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClassRow, EventRow } from "./types";
import { madridDateOffsetISO } from "./dates";

/* ---------- imagery ---------- */

const IMAGE_KEYS = [
  "boxing", "gym", "gymv", "mobility", "tread", "kb", "pool",
  "sauna", "dinner", "hike", "pilates", "yoga", "tub",
] as const;

const KEYWORDS: Array<[RegExp, string]> = [
  [/box/i, "boxing"],
  [/hyrox|circuit/i, "gym"],
  [/strength|kettle|lift/i, "kb"],
  [/mobility|stretch/i, "mobility"],
  [/sprint|agility|tread|run/i, "tread"],
  [/hike|trail|walk|outdoor|retreat/i, "hike"],
  [/pool|swim|water/i, "pool"],
  [/sauna|steam|breath/i, "sauna"],
  [/pilates|reformer/i, "pilates"],
  [/yoga|meditat|sound/i, "yoga"],
  [/dinner|brunch|lunch|dining|chef/i, "dinner"],
  [/recovery|cold|ice|bath/i, "tub"],
];

export function imageSrc(key: string | null | undefined, title = ""): string {
  if (key && (IMAGE_KEYS as readonly string[]).includes(key)) return `/img/${key}.jpg`;
  if (key && /^https?:\/\//.test(key)) return key;
  for (const [re, k] of KEYWORDS) if (re.test(title)) return `/img/${k}.jpg`;
  return "/img/gymv.jpg";
}

export const classImage = (c: ClassRow) => imageSrc(c.image, `${c.title} ${c.venue}`);
export const eventImage = (e: EventRow) => imageSrc(e.image, `${e.title} ${e.venue}`);

export function classCategory(c: ClassRow): string {
  if (c.category && c.category !== "Push") return c.category;
  if (/hike|trail|outdoor|walk/i.test(c.title)) return "Explore";
  return c.intensity === "high" ? "Push" : "Restore";
}

/* ---------- rolling week ---------- */

export interface DayChip {
  iso: string; // yyyy-mm-dd
  weekday: number; // 0=Sun..6=Sat
  short: string; // MON
  date: number; // 14
}

const SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function nextSevenDays(): DayChip[] {
  const out: DayChip[] = [];
  for (let i = 0; i < 7; i++) {
    const iso = madridDateOffsetISO(i);
    const [y, m, d] = iso.split("-").map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    out.push({ iso, weekday: wd, short: SHORT[wd], date: d });
  }
  return out;
}

/* ---------- counts ---------- */

export type ClassCounts = Record<string, number>; // `${class_id}|${date}` -> n
export type EventCounts = Record<string, number>; // event_id -> n

export const countKey = (classId: string, iso: string) => `${classId}|${iso}`;

export async function fetchClassCounts(supabase: SupabaseClient): Promise<ClassCounts> {
  const { data, error } = await supabase.rpc("class_booking_counts", {
    p_from: madridDateOffsetISO(0),
    p_to: madridDateOffsetISO(13),
  });
  if (error) throw error;
  const out: ClassCounts = {};
  for (const r of (data ?? []) as Array<{ class_id: string; session_date: string; n: number }>) {
    out[countKey(r.class_id, r.session_date)] = r.n;
  }
  return out;
}

export async function fetchEventCounts(supabase: SupabaseClient): Promise<EventCounts> {
  const { data, error } = await supabase.rpc("event_rsvp_counts");
  if (error) throw error;
  const out: EventCounts = {};
  for (const r of (data ?? []) as Array<{ event_id: string; n: number }>) out[r.event_id] = r.n;
  return out;
}

/* ---------- formatting ---------- */

const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export function eventWhen(e: EventRow): string {
  const [y, m, d] = e.date.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
  return `${SHORT[wd]} ${d} ${MON[m - 1]} · ${e.time}`;
}

export function initials(first: string, last: string): string {
  return `${(first || "").charAt(0)}${(last || "").charAt(0)}`.toUpperCase() || "C";
}

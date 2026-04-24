// Native-Intl date helpers — zero runtime dependencies, tree-shakes to
// almost nothing in the client bundle. Previously this module used
// date-fns-tz which shipped ~40KB of IANA data.

import { MONTH_FULL, MONTH_SHORT } from "./format";

export const MADRID_TZ = "Europe/Madrid";

const DAY_SHORT_ISO = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const DAY_LONG_ISO = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function madridParts(date: Date = new Date()): {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number;
  weekday: number; // 0=Sun … 6=Sat
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: MADRID_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const get = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "0";
  const weekdayIdx = (DAY_SHORT_ISO as readonly string[]).indexOf(
    get("weekday"),
  );
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")) % 24, // en-US can return "24" at midnight on some VMs
    minute: Number(get("minute")),
    weekday: weekdayIdx < 0 ? 0 : weekdayIdx,
  };
}

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function todayMadridISO(): string {
  const p = madridParts();
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

export function madridDateOffsetISO(offsetDays: number): string {
  // Take today in Madrid as a UTC-noon instant so DST jumps can't shift
  // the calendar date when we add whole days.
  const p = madridParts();
  const base = Date.UTC(p.year, p.month - 1, p.day, 12, 0, 0);
  const shifted = new Date(base + offsetDays * 24 * 60 * 60 * 1000);
  return `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(
    shifted.getUTCDate(),
  )}`;
}

/** 0 = Sunday … 6 = Saturday, matching Date.getDay() semantics. */
export function madridDayOfWeek(): number {
  return madridParts().weekday;
}

/**
 * Compute the ISO date (yyyy-mm-dd) for the next occurrence of a given
 * weekday (0=Sun…6=Sat) at a given "HH:MM". If today is that weekday and
 * the time has not yet passed in Madrid, returns today. Otherwise rolls
 * forward.
 */
export function nextOccurrenceISO(classDay: number, classTime: string): string {
  const p = madridParts();
  let offset = (classDay - p.weekday + 7) % 7;
  if (offset === 0) {
    const nowHM = `${pad2(p.hour)}:${pad2(p.minute)}`;
    if (nowHM >= classTime) offset = 7;
  }
  return madridDateOffsetISO(offset);
}

/** "Wed 28 Apr" — parsed from a yyyy-mm-dd string. */
export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  // Construct a UTC-noon Date so the month/day reading can't cross a
  // timezone boundary when we call getUTC*.
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return `${DAY_SHORT_ISO[date.getUTCDay()]} ${d} ${MONTH_SHORT[m - 1]}`;
}

/** "Wednesday 28 April". */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return `${DAY_LONG_ISO[date.getUTCDay()]} ${d} ${MONTH_FULL[m - 1]}`;
}

export function greeting(): string {
  const h = madridParts().hour;
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

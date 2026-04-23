import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { addDays, format, startOfDay } from "date-fns";
import { MONTH_SHORT } from "./format";

export const MADRID_TZ = "Europe/Madrid";

export function todayMadridISO(): string {
  return formatInTimeZone(new Date(), MADRID_TZ, "yyyy-MM-dd");
}

export function madridDateOffsetISO(offsetDays: number): string {
  const now = toZonedTime(new Date(), MADRID_TZ);
  const d = addDays(startOfDay(now), offsetDays);
  return format(d, "yyyy-MM-dd");
}

/** 0 = Sunday … 6 = Saturday, matching Date.getDay() semantics. */
export function madridDayOfWeek(): number {
  return Number(formatInTimeZone(new Date(), MADRID_TZ, "e")) - 1;
}

/**
 * Compute the ISO date (yyyy-mm-dd) for the next occurrence of a given
 * weekday (0=Sun…6=Sat) at a given "HH:MM". If today is that weekday and
 * the time has not yet passed in Madrid, returns today. Otherwise rolls
 * forward.
 */
export function nextOccurrenceISO(classDay: number, classTime: string): string {
  const today = madridDayOfWeek();
  let offset = (classDay - today + 7) % 7;
  if (offset === 0) {
    const nowHM = formatInTimeZone(new Date(), MADRID_TZ, "HH:mm");
    if (nowHM >= classTime) offset = 7;
  }
  return madridDateOffsetISO(offset);
}

/** Short label like "Wed 28 Apr". */
export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNames[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
}

/** Long label like "Wednesday 28 April". */
export function formatLongDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  const longNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${longNames[d.getUTCDay()]} ${d.getUTCDate()} ${months[d.getUTCMonth()]}`;
}

export function greeting(): string {
  const h = Number(formatInTimeZone(new Date(), MADRID_TZ, "H"));
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

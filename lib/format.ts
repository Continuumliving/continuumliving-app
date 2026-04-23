export const DAY_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const MONTH_FULL = [
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
] as const;

export function classSlug(day: number, time: string): string {
  return `${day}-${time.replace(":", "")}`;
}

export function parseClassSlug(
  slug: string,
): { day: number; time: string } | null {
  const parts = slug.split("-");
  if (parts.length !== 2) return null;
  const day = Number(parts[0]);
  if (!Number.isInteger(day) || day < 1 || day > 7) return null;
  const raw = parts[1];
  if (raw.length !== 4 || !/^\d{4}$/.test(raw)) return null;
  const time = `${raw.slice(0, 2)}:${raw.slice(2)}`;
  return { day, time };
}

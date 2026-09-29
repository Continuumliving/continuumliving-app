import type { ProfileRow } from "./types";

export function fullName(
  p: Pick<ProfileRow, "first_name" | "last_name" | "email"> | null | undefined,
): string {
  if (!p) return "Former resident";
  return `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || p.email || "Resident";
}

export function initials(p: Pick<ProfileRow, "first_name" | "last_name"> | null | undefined): string {
  if (!p) return "·";
  const a = (p.first_name ?? "").trim().charAt(0);
  const b = (p.last_name ?? "").trim().charAt(0);
  return (a + b).toUpperCase() || "·";
}

/** "28 Sep 2026, 14:05" in Madrid time, from a timestamptz. */
export function formatStamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** "28 Sep 2026" in Madrid time, from a timestamptz. */
export function formatDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Build a CSV string with proper quoting (Excel-friendly, UTF-8 BOM added on download). */
export function toCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>): string {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

/** Add whole days to a yyyy-mm-dd string (UTC-noon arithmetic, DST-safe). */
export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d, 12) + days * 86400000);
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, "0")}-${String(t.getUTCDate()).padStart(2, "0")}`;
}

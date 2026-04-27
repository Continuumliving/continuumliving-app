export type Development = "almina" | "alcantara";
export type Intensity = "high" | "low";
export type EventKind =
  | "dining"
  | "social"
  | "workshop"
  | "excursion"
  | "signature";
export type Role = "user" | "admin";

export interface DevelopmentRow {
  id: Development;
  name: string;
  location: string;
  series: string;
  accent: "terracotta" | "olive";
}

export interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  development: Development;
  unit_number: string;
  joined_at: string;
  role: Role;
}

export interface ClassRow {
  id: string;
  day: number; // 1..7 (Mon..Sun)
  time: string; // "HH:MM"
  title: string;
  venue: string;
  intensity: Intensity;
  coach: string;
  duration_min: number;
  description: string;
  active: boolean;
}

export interface BookingRow {
  id: string;
  profile_id: string;
  class_id: string;
  session_date: string; // yyyy-mm-dd
  created_at: string;
}

export interface EventRow {
  id: string;
  date: string;
  time: string;
  title: string;
  venue: string;
  host: string;
  capacity: number;
  kind: EventKind;
  description: string;
}

export interface EventRsvpRow {
  id: string;
  profile_id: string;
  event_id: string;
  created_at: string;
}

export interface SessionHistoryRow {
  id: string;
  profile_id: string;
  class_id: string | null;
  title: string;
  venue: string;
  intensity: Intensity;
  session_date: string;
  completed_at: string;
}

export const DEVELOPMENTS: Record<Development, DevelopmentRow> = {
  almina: {
    id: "almina",
    name: "Almina Residence",
    location: "Estepona",
    series: "Series One",
    accent: "terracotta",
  },
  alcantara: {
    id: "alcantara",
    name: "Almina Residence",
    location: "Estepona",
    series: "Series One",
    accent: "olive",
  },
};

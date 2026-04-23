"use client";

import { useMemo, useState } from "react";
import { DayFilter } from "./DayFilter";
import { HeroNameCard } from "./HeroNameCard";
import { SessionCard } from "./SessionCard";
import { DAY_NAMES, classSlug, MONTH_SHORT } from "@/lib/format";
import { nextOccurrenceISO } from "@/lib/dates";
import type { ClassRow } from "@/lib/types";

interface ClassesViewProps {
  classes: ClassRow[];
  bookedKeys: string[]; // class_id|session_date
}

export function ClassesView({ classes, bookedKeys }: ClassesViewProps) {
  const [filter, setFilter] = useState<number | null>(null);
  const active = filter === null ? classes : classes.filter((c) => c.day === filter);

  const grouped = useMemo(() => {
    const g: Record<number, ClassRow[]> = {};
    for (const c of active) {
      (g[c.day] ??= []).push(c);
    }
    for (const k of Object.keys(g)) {
      g[Number(k)].sort((a, b) => a.time.localeCompare(b.time));
    }
    return g;
  }, [active]);

  const bookedSet = new Set(bookedKeys);
  const daysInProgramme = Array.from(new Set(classes.map((c) => c.day))).sort(
    (a, b) => a - b,
  );

  return (
    <div className="screen">
      <HeroNameCard
        eyebrow="— The programme"
        title={
          <>
            Ten sessions.
            <br />
            <em>Five days.</em>
          </>
        }
        intro="Mixed high and low, morning and evening. Designed for residents who care how they feel at sixty, not just forty."
      />

      <DayFilter value={filter} onChange={setFilter} days={daysInProgramme} />

      {Object.keys(grouped)
        .map(Number)
        .sort((a, b) => a - b)
        .map((day) => {
          const items = grouped[day];
          const sample = items[0];
          const next = nextOccurrenceISO(sample.day, sample.time);
          const d = new Date(`${next}T12:00:00Z`);
          const dateLabel = `${d.getUTCDate()} ${MONTH_SHORT[d.getUTCMonth()]}`;
          return (
            <div key={day}>
              <div className="day-header">
                <h3>{DAY_NAMES[day]}</h3>
                <div className="date">{dateLabel}</div>
              </div>
              {items.map((c) => {
                const sessionDate = nextOccurrenceISO(c.day, c.time);
                const booked = bookedSet.has(`${c.id}|${sessionDate}`);
                return (
                  <SessionCard
                    key={c.id}
                    slug={classSlug(c.day, c.time)}
                    time={c.time}
                    title={c.title}
                    intensity={c.intensity}
                    venue={c.venue}
                    coach={c.coach}
                    booked={booked}
                  />
                );
              })}
            </div>
          );
        })}
    </div>
  );
}

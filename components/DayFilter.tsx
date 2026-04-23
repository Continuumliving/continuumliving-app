"use client";

import { DAY_SHORT } from "@/lib/format";

interface DayFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
  days: number[];
}

export function DayFilter({ value, onChange, days }: DayFilterProps) {
  return (
    <div className="filter-bar">
      <button
        className={`pill${value === null ? " active" : ""}`}
        onClick={() => onChange(null)}
        type="button"
      >
        All days
      </button>
      {days.map((d) => (
        <button
          key={d}
          className={`pill${value === d ? " active" : ""}`}
          onClick={() => onChange(d)}
          type="button"
        >
          {DAY_SHORT[d]}
        </button>
      ))}
    </div>
  );
}

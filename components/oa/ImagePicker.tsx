"use client";

import { IMAGE_KEYS } from "@/lib/owners";

export function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="oa-picker" role="radiogroup" aria-label="Photo">
      {IMAGE_KEYS.map((k) => (
        <button
          key={k}
          type="button"
          role="radio"
          aria-checked={value === k}
          className={value === k ? "on" : ""}
          onClick={() => onChange(k)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img loading="lazy" decoding="async" src={`/img/${k}.webp`} alt={k} />
        </button>
      ))}
    </div>
  );
}

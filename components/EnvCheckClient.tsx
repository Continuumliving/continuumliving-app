"use client";

import { useEffect, useState } from "react";

function mask(v: string | undefined | null): string {
  if (!v) return "(missing)";
  if (v.length < 10) return `"${v}" (short)`;
  return `${v.slice(0, 6)}…${v.slice(-4)} · ${v.length} chars`;
}

function shape(v: string | undefined | null): string {
  if (!v) return "—";
  if (/^ey[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return "looks like JWT ✓";
  if (/^https:\/\/.+\.supabase\.co\/?$/.test(v))
    return "looks like Supabase URL ✓";
  return "unexpected shape";
}

export function EnvCheckClient() {
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [key, setKey] = useState<string | undefined>(undefined);

  useEffect(() => {
    setUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
    setKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  return (
    <div style={{ marginTop: 28 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        — Client bundle (what the browser sees)
      </div>
      <div className="spec-row">
        <span className="spec-label">NEXT_PUBLIC_SUPABASE_URL</span>
        <span className="spec-value" style={{ fontSize: 13 }}>
          {mask(url)}
        </span>
      </div>
      <div className="spec-row">
        <span className="spec-label">shape</span>
        <span className="spec-value" style={{ fontSize: 13 }}>
          {shape(url)}
        </span>
      </div>
      <div className="spec-row">
        <span className="spec-label">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
        <span className="spec-value" style={{ fontSize: 13 }}>
          {mask(key)}
        </span>
      </div>
      <div className="spec-row">
        <span className="spec-label">shape</span>
        <span className="spec-value" style={{ fontSize: 13 }}>
          {shape(key)}
        </span>
      </div>
    </div>
  );
}

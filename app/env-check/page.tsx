import { EnvCheckClient } from "@/components/EnvCheckClient";

export const dynamic = "force-dynamic";

function mask(v: string | undefined | null): string {
  if (!v) return "(missing)";
  if (v.length < 10) return `"${v}" (short)`;
  return `${v.slice(0, 6)}…${v.slice(-4)} · ${v.length} chars`;
}

function shape(v: string | undefined | null): string {
  if (!v) return "—";
  if (/^ey[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return "looks like JWT ✓";
  if (/^https:\/\/.+\.supabase\.co\/?$/.test(v)) return "looks like Supabase URL ✓";
  return "unexpected shape";
}

export default function EnvCheckPage() {
  const serverUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="auth-screen">
      <h1 className="h1">
        Environment
        <br />
        <em>diagnostic.</em>
      </h1>
      <p className="intro">
        What this Vercel build has inlined. If either value below reads
        <em> (missing)</em>, add the variable in Vercel &rarr; Project &rarr;
        Settings &rarr; Environment Variables for <strong>Production</strong>,
        then click <strong>Redeploy</strong>. Next.js only inlines
        <code> NEXT_PUBLIC_* </code> at build time.
      </p>

      <div style={{ marginTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>
          — Server (baked at build)
        </div>
        <div className="spec-row">
          <span className="spec-label">NEXT_PUBLIC_SUPABASE_URL</span>
          <span className="spec-value" style={{ fontSize: 13 }}>
            {mask(serverUrl)}
          </span>
        </div>
        <div className="spec-row">
          <span className="spec-label">shape</span>
          <span className="spec-value" style={{ fontSize: 13 }}>
            {shape(serverUrl)}
          </span>
        </div>
        <div className="spec-row">
          <span className="spec-label">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
          <span className="spec-value" style={{ fontSize: 13 }}>
            {mask(serverKey)}
          </span>
        </div>
        <div className="spec-row">
          <span className="spec-label">shape</span>
          <span className="spec-value" style={{ fontSize: 13 }}>
            {shape(serverKey)}
          </span>
        </div>
      </div>

      <EnvCheckClient />
    </div>
  );
}

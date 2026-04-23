"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

const PLACEHOLDER_MARKERS = ["HIER_JE", "YOUR_SUPABASE", "paste", "PASTE"];

function looksLikePlaceholder(value: string): boolean {
  return PLACEHOLDER_MARKERS.some((m) => value.includes(m));
}

export function getBrowserClient() {
  if (client) return client;

  // NOTE: NEXT_PUBLIC_* variables are inlined at BUILD time by Next.js.
  // If this error fires in production, the build ran without the env
  // variables set — redeploy the Vercel project AFTER adding them.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Missing env at build time: ${missing.join(
        ", ",
      )}. Add it in Vercel → Project → Settings → Environment Variables (Production), then click Redeploy — Next.js inlines NEXT_PUBLIC_* at build time.`,
    );
  }

  if (looksLikePlaceholder(url!) || looksLikePlaceholder(anonKey!)) {
    throw new Error(
      "Env still contains placeholder values from .env.local.example. Replace with your real Supabase URL and anon key, then redeploy.",
    );
  }

  if (!/^https:\/\/.+\.supabase\.co\/?$/.test(url!)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase URL: "${url}". Expected https://<project>.supabase.co`,
    );
  }

  // Basic shape check for the anon JWT — prevents confusion with the
  // service_role key (also a JWT, same shape) but at least flags a
  // non-JWT string that might have been pasted by mistake.
  if (!/^ey[\w-]+\.[\w-]+\.[\w-]+$/.test(anonKey!)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY does not look like a JWT. Copy the anon public key from Supabase → Project Settings → API.",
    );
  }

  client = createBrowserClient(url!, anonKey!);
  return client;
}

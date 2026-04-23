"use client";

import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserClient() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase credentials missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (and in your Vercel project settings).",
    );
  }
  if (url.includes("HIER_JE") || anonKey.includes("HIER_JE")) {
    throw new Error(
      "Supabase credentials still contain the placeholder values from .env.local.example. Replace them with your real project URL and anon key.",
    );
  }
  if (!/^https:\/\/.+\.supabase\.co/.test(url)) {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase URL: ${url}`,
    );
  }
  client = createBrowserClient(url, anonKey);
  return client;
}

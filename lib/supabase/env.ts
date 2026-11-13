/**
 * Reads the Supabase settings and repairs common copy/paste slips
 * (spaces, quotes, "supbase", ".com" instead of ".co", trailing slash)
 * so a typo in the hosting dashboard cannot lock everyone out.
 * Both values are public by design (they ship to every browser).
 */
const FALLBACK_URL = "https://zopjwfcmjpqshbskwyxl.supabase.co";

function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/^["']|["']$/g, "").trim();
}

export function supabaseUrl(): string {
  let u = clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!u) return FALLBACK_URL;
  if (!/^https?:\/\//.test(u)) u = `https://${u}`;
  u = u.replace(/supbase|supabse|subabase/gi, "supabase");
  u = u.replace(/\.supabase\.com?\b/i, ".supabase.co");
  u = u.replace(/\/+$/, "");
  return u;
}

export function supabaseAnonKey(): string {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY).replace(/\s+/g, "");
}

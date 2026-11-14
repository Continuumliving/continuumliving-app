import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase emails (password reset, email
 * confirmation). Supports the token_hash flow (works when the link is
 * opened in a different browser than the one that requested it) and
 * the PKCE ?code= flow.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") || (type === "recovery" ? "/reset" : "/today");
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/today";

  const supabase = getServerClient();
  let ok = false;
  try {
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
      ok = !error;
    } else if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      ok = !error;
    }
  } catch {
    ok = false;
  }

  const dest = request.nextUrl.clone();
  dest.search = "";
  if (ok) {
    dest.pathname = next;
  } else {
    dest.pathname = "/signin";
    dest.searchParams.set("notice", "link");
  }
  return NextResponse.redirect(dest);
}

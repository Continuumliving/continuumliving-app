"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { InlineNotice } from "./InlineNotice";
import { getBrowserClient } from "@/lib/supabase/client";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!email || !password) {
      setErrorMsg("Please provide your email and password.");
      return;
    }
    setBusy(true);
    try {
      let supabase;
      try {
        supabase = getBrowserClient();
      } catch (envErr) {
        console.error(envErr);
        setErrorMsg(
          "Supabase is not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        );
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        console.error("signInWithPassword error:", error);
        const m = (error.message || "").toLowerCase();
        if (m.includes("invalid login") || m.includes("credentials")) {
          setErrorMsg("Those credentials could not be verified.");
        } else if (m.includes("email not confirmed")) {
          setErrorMsg(
            "Please confirm your email address first. We sent a link at signup.",
          );
        } else {
          setErrorMsg(error.message || "We could not sign you in.");
        }
        return;
      }
      if (!data?.session) {
        setErrorMsg(
          "Signed in but no session was returned. Please try again.",
        );
        return;
      }
      const next = params.get("next") || "/today";
      router.replace(next);
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error ? err.message : "The connection is, for a moment, elsewhere.";
      setErrorMsg(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {errorMsg ? <InlineNotice>{errorMsg}</InlineNotice> : null}

        <button type="submit" className="btn btn-terracotta" disabled={busy}>
          {busy ? "Entering…" : "Enter"}
        </button>
      </form>
      <div className="auth-footer">
        First time?
        <Link href="/signup">Create account</Link>
      </div>
    </>
  );
}

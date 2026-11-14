"use client";

import Link from "next/link";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { InlineNotice } from "@/components/InlineNotice";
import { getBrowserClient } from "@/lib/supabase/client";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErr("Please enter the email address of your account.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await getBrowserClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/confirm?next=/reset`,
      });
      if (error && !/rate|seconds/i.test(error.message)) throw error;
      setSent(true);
    } catch {
      setErr("We could not send the email just now. Please try again in a minute.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <BrandMark />
      <h1 className="h1">
        Forgot your
        <br />
        <em>password?</em>
      </h1>
      {sent ? (
        <>
          <p className="intro">
            If an account exists for <strong>{email.trim()}</strong>, an email with a link to choose a new
            password is on its way. Open it on this device.
          </p>
          <Link href="/signin" className="btn">Back to sign in</Link>
        </>
      ) : (
        <>
          <p className="intro">Enter the email address of your account and we will send you a link to choose a new password.</p>
          <form className="auth-form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {err ? <InlineNotice>{err}</InlineNotice> : null}
            <button type="submit" className="btn" disabled={busy}>{busy ? "Sending…" : "Send link"}</button>
          </form>
          <div className="auth-footer">
            Remembered it? <Link href="/signin">Sign in</Link>
          </div>
        </>
      )}
    </div>
  );
}

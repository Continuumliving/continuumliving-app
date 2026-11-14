"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { InlineNotice } from "@/components/InlineNotice";
import { getBrowserClient } from "@/lib/supabase/client";

export default function ResetPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (pw.length < 8) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords do not match.");
    setBusy(true);
    try {
      const sb = getBrowserClient();
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) throw error;
      router.replace("/today");
    } catch (e) {
      const m = (e as Error).message || "";
      setErr(/session/i.test(m) ? "This reset link has expired. Request a new one from the sign-in screen." : /different|same/i.test(m) ? "Choose a password you have not used before." : "Could not save the new password. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <BrandMark />
      <h1 className="h1">
        Choose a new
        <br />
        <em>password.</em>
      </h1>
      <p className="intro">At least 8 characters. You will stay signed in on this device.</p>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="pw">New password</label>
          <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw2">Repeat password</label>
          <input id="pw2" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        {err ? <InlineNotice>{err}</InlineNotice> : null}
        <button type="submit" className="btn" disabled={busy}>{busy ? "Saving…" : "Save password"}</button>
      </form>
    </div>
  );
}

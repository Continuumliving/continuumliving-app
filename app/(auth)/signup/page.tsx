"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { InlineNotice } from "@/components/InlineNotice";
import { getBrowserClient } from "@/lib/supabase/client";
import { DEVELOPMENTS } from "@/lib/types";
import type { Development } from "@/lib/types";

type Status =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "confirm-email" };

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [development, setDevelopment] = useState<Development | "">("");
  const [unit, setUnit] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus({ kind: "idle" });
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !development ||
      !unit
    ) {
      setStatus({ kind: "error", message: "Please complete every field." });
      return;
    }
    if (password.length < 8) {
      setStatus({
        kind: "error",
        message: "Passwords must be eight characters or more.",
      });
      return;
    }
    setBusy(true);
    try {
      let supabase;
      try {
        supabase = getBrowserClient();
      } catch (envErr) {
        console.error(envErr);
        const msg =
          envErr instanceof Error
            ? envErr.message
            : "Supabase is not configured on this deploy.";
        setStatus({ kind: "error", message: msg });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            development,
            unit_number: unit.trim(),
          },
        },
      });

      if (error) {
        console.error("signUp error:", error);
        const m = (error.message || "").toLowerCase();
        if (m.includes("already registered") || m.includes("exists")) {
          setStatus({
            kind: "error",
            message: "That email is already registered. Please sign in instead.",
          });
        } else if (m.includes("database") || m.includes("unexpected")) {
          // Typical sign that a post-signup trigger raised — the hardened
          // migration in supabase/migrations/0002_signup_hardening.sql
          // fixes this, and the client-side ensureMyProfile() fallback
          // covers any profile row still missing on first app load.
          setStatus({
            kind: "error",
            message:
              "A database rule rejected signup. Run supabase/migrations/0002_signup_hardening.sql, then try again.",
          });
        } else {
          setStatus({
            kind: "error",
            message: error.message || "We could not create your account.",
          });
        }
        return;
      }

      // If the Supabase project has "Confirm email" enabled, signUp
      // returns a user without a session. Don't navigate into the app —
      // the middleware would just bounce us back to /signin.
      if (!data?.session) {
        setStatus({ kind: "confirm-email" });
        return;
      }

      router.replace("/today");
    } catch (err) {
      console.error(err);
      const msg =
        err instanceof Error
          ? err.message
          : "The connection is, for a moment, elsewhere.";
      setStatus({ kind: "error", message: msg });
    } finally {
      setBusy(false);
    }
  }

  if (status.kind === "confirm-email") {
    return (
      <div className="auth-screen">
        <BrandMark />
        <h1 className="h1">
          Almost there.
          <br />
          <em>Check your inbox.</em>
        </h1>
        <p className="intro">
          We have sent a confirmation link to <strong>{email}</strong>. Open it
          on this device to complete your enrolment. You can close this screen
          in the meantime.
        </p>
        <Link href="/signin" className="btn btn-ghost">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <BrandMark />
      <h1 className="h1">
        Create
        <br />
        <em>your account.</em>
      </h1>
      <p className="intro">
        Please enter the details provided with your residence. Your account is
        linked to your development&apos;s membership.
      </p>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="first-name">First name</label>
          <input
            id="first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="last-name">Last name</label>
          <input
            id="last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="development">Residence</label>
          <select
            id="development"
            value={development}
            onChange={(e) => setDevelopment(e.target.value as Development | "")}
          >
            <option value="">Select your development</option>
            {Object.values(DEVELOPMENTS).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.location}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="unit">Apartment / Villa number</label>
          <input
            id="unit"
            type="text"
            placeholder="e.g. Villa 11 or Apartment 304"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
          />
        </div>

        {status.kind === "error" ? (
          <InlineNotice>{status.message}</InlineNotice>
        ) : null}

        <button type="submit" className="btn btn-terracotta" disabled={busy}>
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>
      <div className="auth-footer">
        Already registered?
        <Link href="/signin">Sign in</Link>
      </div>
    </div>
  );
}

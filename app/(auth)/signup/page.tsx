"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { useToast } from "@/components/Toast";
import { getBrowserClient } from "@/lib/supabase/client";
import { DEVELOPMENTS } from "@/lib/types";
import type { Development } from "@/lib/types";

export default function SignUpPage() {
  const router = useRouter();
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [development, setDevelopment] = useState<Development | "">("");
  const [unit, setUnit] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !development ||
      !unit
    ) {
      toast("Please complete every field.");
      return;
    }
    if (password.length < 8) {
      toast("Passwords must be eight characters or more.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const { error } = await supabase.auth.signUp({
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
        toast(
          error.message.includes("registered")
            ? "That email is already registered."
            : "We could not create your account.",
        );
        return;
      }
      router.replace("/today");
      router.refresh();
    } catch {
      toast("The connection is, for a moment, elsewhere.");
    } finally {
      setBusy(false);
    }
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
      <form className="auth-form" onSubmit={submit}>
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

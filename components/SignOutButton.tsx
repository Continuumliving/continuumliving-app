"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "./Toast";
import { getBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    if (!window.confirm("Sign out of Continuum Living?")) return;
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      await supabase.auth.signOut();
      router.replace("/signin");
      router.refresh();
    } catch {
      toast("We could not sign you out just now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-ghost"
      onClick={signOut}
      disabled={busy}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}

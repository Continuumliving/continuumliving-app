"use client";

import { useEffect, useState } from "react";
import { disablePush, enablePush, getPushState, type PushState } from "@/lib/push";

export function PushToggle({ profileId }: { profileId: string }) {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    getPushState().then(setState).catch(() => setState("unsupported"));
  }, []);

  async function toggle() {
    if (!state || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const next = state === "on" ? await disablePush() : await enablePush(profileId);
      setState(next);
      if (next === "denied") setNote("Notifications are blocked. Allow them in your phone's settings for this app.");
    } catch {
      setNote("Could not change notifications just now.");
    } finally {
      setBusy(false);
    }
  }

  const hint =
    state === "needs-install"
      ? "On iPhone: tap Share → Add to Home Screen, open the app from there, then turn this on."
      : state === "unsupported"
        ? "This browser does not support notifications."
        : state === "denied"
          ? "Blocked in your phone's settings."
          : "Messages from your coach and booking updates.";

  return (
    <div className="oa-kv" style={{ alignItems: "center" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--ink)" }}>Notifications</div>
        <div className="oa-meta" style={{ marginTop: 2 }}>{note || hint}</div>
      </div>
      {state === "on" || state === "off" ? (
        <button type="button" className={`oa-switch${state === "on" ? " on" : ""}`} role="switch" aria-checked={state === "on"} onClick={toggle} disabled={busy} aria-label="Notifications">
          <i />
        </button>
      ) : null}
    </div>
  );
}

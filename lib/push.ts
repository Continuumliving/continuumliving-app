"use client";

import { getBrowserClient } from "@/lib/supabase/client";

/** Public half of the VAPID key pair (safe to ship to browsers). */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGSXDOLSjnWBasGVBCpVllrF9aLkFrmxiLLQCSnrhmBYAKgmJkSyP6y4a5Km50tTGxOwPTzncpamJF-q2jqAEh8";

export type PushState = "unsupported" | "needs-install" | "denied" | "off" | "on";

function b64ToBytes(b64: string): Uint8Array {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function isIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

export async function getPushState(): Promise<PushState> {
  if (typeof window === "undefined") return "unsupported";
  if (isIOS() && !isStandalone()) return "needs-install";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  return sub && Notification.permission === "granted" ? "on" : "off";
}

export async function enablePush(profileId: string): Promise<PushState> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return perm === "denied" ? "denied" : "off";
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID_PUBLIC_KEY).buffer as ArrayBuffer }));
  const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
  const sb = getBrowserClient();
  await sb.from("push_subscriptions").delete().eq("endpoint", json.endpoint);
  const { error } = await sb.from("push_subscriptions").insert({
    profile_id: profileId,
    endpoint: json.endpoint,
    p256dh: json.keys.p256dh,
    auth: json.keys.auth,
  });
  if (error) throw error;
  return "on";
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  if (sub) {
    await getBrowserClient().from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
  return "off";
}

/** Fire-and-forget: ask the server to notify the other side of a thread. */
export function notifyThread(residentId: string, preview: string) {
  fetch("/api/notify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ residentId, preview: preview.slice(0, 140) }),
    keepalive: true,
  }).catch(() => {});
}

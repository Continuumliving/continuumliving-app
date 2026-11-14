"use client";

import { useEffect, useState } from "react";
import { LogoMark } from "./Icons";

const KEY = "continuum:install-dismissed";
const SNOOZE_DAYS = 5;

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function standalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function snoozed(): boolean {
  try {
    const t = Number(localStorage.getItem(KEY) || 0);
    return Date.now() - t < SNOOZE_DAYS * 864e5;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [mode, setMode] = useState<"ios" | "android" | null>(null);
  const [bip, setBip] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (standalone() || snoozed()) return;
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (ios) {
      const t = setTimeout(() => setMode("ios"), 1200);
      return () => clearTimeout(t);
    }
    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
      setMode("android");
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  function close() {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {}
    setMode(null);
  }

  async function install() {
    if (!bip) return;
    await bip.prompt();
    await bip.userChoice.catch(() => null);
    close();
  }

  if (!mode) return null;

  return (
    <div className="oa-install" role="dialog" aria-modal="true" aria-labelledby="oa-install-t">
      <div className="oa-install-scrim" onClick={close} />
      <div className="oa-install-card">
        <div className="oa-install-logo"><LogoMark /></div>
        <h2 id="oa-install-t" className="oa-h2" style={{ textAlign: "center" }}>Keep Continuum on your Home Screen</h2>
        <p className="oa-sub" style={{ textAlign: "center", margin: "6px 0 0", lineHeight: 1.5 }}>
          Opens like an app, full screen, with messages from your coach as notifications.
        </p>
        {mode === "ios" ? (
          <ol className="oa-install-steps">
            <li>
              <span className="n">1</span>
              <span>Tap <b>Share</b> in the browser bar</span>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </li>
            <li>
              <span className="n">2</span>
              <span>Choose <b>Add to Home Screen</b></span>
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
            </li>
            <li>
              <span className="n">3</span>
              <span>Open <b>Continuum</b> from your Home Screen</span>
              <span className="oa-install-mini"><LogoMark /></span>
            </li>
          </ol>
        ) : (
          <button className="btn" style={{ marginTop: 22, borderRadius: 999 }} onClick={install}>Install the app</button>
        )}
        <button className="oa-install-later" onClick={close}>Later</button>
      </div>
    </div>
  );
}

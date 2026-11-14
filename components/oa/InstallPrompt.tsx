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

const ShareIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const AddIcon = (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);

export function InstallPrompt() {
  const [mode, setMode] = useState<"ios" | "android" | "inapp" | null>(null);
  const [variant, setVariant] = useState<"ios26" | "ios" | "chrome">("ios");
  const [bip, setBip] = useState<BIPEvent | null>(null);

  useEffect(() => {
    if (standalone() || snoozed()) return;
    const ua = navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    if (ios) {
      const inApp = /Instagram|FBAN|FBAV|LinkedInApp|Line\//i.test(ua);
      const m = ua.match(/Version\/(\d+)/);
      const major = m ? Number(m[1]) : 0;
      setVariant(/CriOS|EdgiOS|FxiOS/i.test(ua) ? "chrome" : major >= 26 ? "ios26" : "ios");
      const t = setTimeout(() => setMode(inApp ? "inapp" : "ios"), 1200);
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
        {mode === "inapp" ? (
          <ol className="oa-install-steps">
            <li><span className="n">1</span><span>Tap <b>•••</b> at the top of this screen</span></li>
            <li><span className="n">2</span><span>Choose <b>Open in Safari</b></span></li>
            <li><span className="n">3</span><span>Sign in there and follow the steps</span></li>
          </ol>
        ) : mode === "ios" ? (
          <ol className="oa-install-steps">
            {variant === "ios26" && (
              <>
                <li><span className="n">1</span><span>Tap <b>•••</b> at the bottom right</span><span className="oa-install-key">•••</span></li>
                <li><span className="n">2</span><span>Tap <b>Share</b></span>{ShareIcon}</li>
                <li><span className="n">3</span><span>Scroll down, tap <b>Add to Home Screen</b></span>{AddIcon}</li>
              </>
            )}
            {variant === "ios" && (
              <>
                <li><span className="n">1</span><span>Tap <b>Share</b> at the bottom of the screen</span>{ShareIcon}</li>
                <li><span className="n">2</span><span>Scroll down, tap <b>Add to Home Screen</b></span>{AddIcon}</li>
                <li><span className="n">3</span><span>Tap <b>Add</b>, then open Continuum from your Home Screen</span></li>
              </>
            )}
            {variant === "chrome" && (
              <>
                <li><span className="n">1</span><span>Tap <b>Share</b> at the top right, next to the address</span>{ShareIcon}</li>
                <li><span className="n">2</span><span>Tap <b>Add to Home Screen</b></span>{AddIcon}</li>
                <li><span className="n">3</span><span>Tap <b>Add</b>, then open Continuum from your Home Screen</span></li>
              </>
            )}
          </ol>
        ) : (
          <button className="btn" style={{ marginTop: 22, borderRadius: 999 }} onClick={install}>Install the app</button>
        )}
        <button className="oa-install-later" onClick={close}>Later</button>
        {mode === "ios" && variant !== "chrome" && (
          <div className={`oa-install-arrow${variant === "ios26" ? " right" : ""}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28"><path d="M12 4v15M6 13l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
        )}
      </div>
    </div>
  );
}

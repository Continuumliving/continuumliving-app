"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { fetchThread, markThreadRead, sendMessage, timeLabel, type CoachMessage } from "@/lib/messages";

interface Props {
  residentId: string;
  meId: string;
  /** Shown above messages from the other side. */
  otherName: string;
  otherAvatar?: string;
  emptyText: string;
  placeholder: string;
}

export function Thread({ residentId, meId, otherName, otherAvatar, emptyText, placeholder }: Props) {
  const [msgs, setMsgs] = useState<CoachMessage[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const count = useRef(0);

  const load = useCallback(async () => {
    try {
      const sb = getBrowserClient();
      const rows = await fetchThread(sb, residentId);
      setMsgs(rows);
      setError(null);
      if (rows.some((m) => !m.read_at && m.sender_id !== meId)) markThreadRead(sb, residentId);
    } catch {
      setError("Messages could not be loaded just now.");
      setMsgs((m) => m ?? []);
    }
  }, [residentId, meId]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 8000);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  useEffect(() => {
    if (msgs && msgs.length !== count.current) {
      count.current = msgs.length;
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [msgs]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const row = await sendMessage(getBrowserClient(), residentId, meId, body);
      setMsgs((m) => [...(m ?? []), row]);
      setText("");
    } catch {
      setError("Your message was not sent. Please try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <div className="oa-thread" aria-live="polite">
        {msgs === null && <div className="oa-sub" style={{ textAlign: "center", padding: 20 }}>Loading…</div>}
        {msgs && msgs.length === 0 && (
          <div className="oa-card oa-empty"><p>{emptyText}</p></div>
        )}
        {msgs?.map((m, i) => {
          const mine = m.sender_id === meId;
          const prev = msgs[i - 1];
          const showHead = !mine && (!prev || prev.sender_id === meId);
          return (
            <div key={m.id} className={`oa-bubble-row${mine ? " me" : ""}`}>
              {showHead && (
                <div className="oa-bubble-head">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {otherAvatar && <img src={otherAvatar} alt="" />}
                  <span>{otherName}</span>
                </div>
              )}
              <div className={`oa-bubble${mine ? " me" : ""}`}>{m.body}</div>
              <div className="oa-bubble-time">{timeLabel(m.created_at)}{mine && m.read_at ? " · Read" : ""}</div>
            </div>
          );
        })}
        {error && <div className="oa-sub" style={{ textAlign: "center", color: "#9a3b2e" }}>{error}</div>}
        <div ref={endRef} />
      </div>
      <form className="oa-compose" onSubmit={send}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          maxLength={2000}
          aria-label="Message"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && window.matchMedia("(pointer:fine)").matches) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
        />
        <button type="submit" className="oa-send" disabled={!text.trim() || sending} aria-label="Send">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </form>
    </>
  );
}

"use client";

import { useActions } from "@/components/oa/useActions";
import { useEventCounts, useEvents, useRsvps } from "@/lib/data-context";
import { todayMadridISO } from "@/lib/dates";
import { eventImage, eventWhen } from "@/lib/owners";

export default function EventsPage() {
  const events = useEvents();
  const rsvps = useRsvps();
  const counts = useEventCounts();
  const { reserve, unreserve, busy } = useActions();
  const today = todayMadridISO();
  const list = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <main className="oa">
      <div>
        <div className="oa-eyebrow">Residents only</div>
        <h1 className="oa-h1">Events</h1>
      </div>
      {list.length === 0 && (
        <div className="oa-card oa-empty">
          <div className="oa-eyebrow">Coming soon</div>
          <p>The next season of resident events is being planned. You will find them here first.</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {list.map((e) => {
          const mine = rsvps.find((r) => r.event_id === e.id);
          const left = Math.max(e.capacity - (counts[e.id] ?? (mine ? 1 : 0)), 0);
          return (
            <article key={e.id} className="oa-card oa-ev">
              <div className="oa-ph">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async" src={eventImage(e)} alt="" />
              </div>
              <div className="oa-body">
                <div className="oa-eyebrow">{eventWhen(e)}</div>
                <h2 className="oa-h2">{e.title}</h2>
                <div className="oa-desc">{e.description}</div>
                <div className="oa-row">
                  <span className="oa-meta">{e.venue} · {left} seats left</span>
                  {mine ? (
                    <button className="oa-pill solid" onClick={() => unreserve(mine.id)} disabled={busy === mine.id}>Reserved ✓</button>
                  ) : (
                    <button className="oa-pill gold" onClick={() => reserve(e.id)} disabled={left === 0 || busy === e.id}>{left === 0 ? "Full" : "Reserve my seat"}</button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}

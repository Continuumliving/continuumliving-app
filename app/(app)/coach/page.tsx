"use client";

import { Thread } from "@/components/oa/Thread";
import { useProfile } from "@/lib/data-context";

export default function CoachPage() {
  const profile = useProfile();
  if (!profile) return null;
  return (
    <main className="oa oa-chat">
      <div className="oa-card oa-coachcard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img loading="lazy" decoding="async" src="/img/coach.webp" alt="Tomash Marko" />
        <div>
          <h1 className="oa-h2">Tomash Marko</h1>
          <div className="oa-sub" style={{ fontSize: 13, marginTop: 3 }}>Your coach · usually replies the same day</div>
        </div>
      </div>
      <Thread
        residentId={profile.id}
        meId={profile.id}
        otherName="Tomash"
        otherAvatar="/img/coach.webp"
        emptyText="Ask for a private session, change your plan, or tell me how you feel. Only you and your coach can read this conversation."
        placeholder="Message your coach"
      />
    </main>
  );
}

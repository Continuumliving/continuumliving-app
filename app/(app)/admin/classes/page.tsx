import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";
import { getRequestClient } from "@/lib/auth-cache";
import { DAY_NAMES } from "@/lib/format";
import type { ClassRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminClassesPage() {
  const supabase = getRequestClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .order("day", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  const classes = (data ?? []) as ClassRow[];

  return (
    <div className="screen">
      <BackButton href="/admin">Back to admin</BackButton>

      <HeroNameCard
        eyebrow="— Programme"
        title={
          <>
            Weekly
            <br />
            <em>programme.</em>
          </>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/classes/new" className="btn btn-terracotta">
          New class
        </Link>
      </div>

      {classes.length === 0 ? (
        <div className="empty-state">
          <p>No classes yet.</p>
        </div>
      ) : (
        classes.map((c) => (
          <Link
            key={c.id}
            href={`/admin/classes/${c.id}`}
            className={`session-card ${c.intensity}`}
          >
            <div className="session-top">
              <div className="session-time">{c.time}</div>
              <span className={`session-intensity ${c.intensity}`}>
                {c.intensity === "high" ? "High" : "Low"}
              </span>
            </div>
            <div className="session-title">{c.title}</div>
            <div className="session-location">
              {DAY_NAMES[c.day]} · {c.venue} · {c.coach}
              {c.active ? "" : " · Inactive"}
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

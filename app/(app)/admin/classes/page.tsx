import Link from "next/link";
import { getRequestClient } from "@/lib/auth-cache";
import { classImage } from "@/lib/owners";
import type { ClassRow } from "@/lib/types";

export const dynamic = "force-dynamic";
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export default async function AdminClassesPage() {
  const { data, error } = await getRequestClient().from("classes").select("*").order("time", { ascending: true });
  if (error) throw error;
  const classes = (data ?? []) as ClassRow[];

  return (
    <main className="oa">
      <Link href="/admin" className="oa-back">‹ Admin</Link>
      <div className="oa-head">
        <div>
          <div className="oa-eyebrow">Programme</div>
          <h1 className="oa-h1">Classes</h1>
          <div className="oa-sub" style={{ marginTop: 4 }}>{classes.filter((c) => c.active).length} a week</div>
        </div>
        <Link href="/admin/classes/new" className="oa-pill gold">+ New class</Link>
      </div>
      {classes.length === 0 && <div className="oa-card oa-empty"><p>No classes yet.</p></div>}
      {ORDER.filter((d) => classes.some((c) => c.day === d)).map((d) => (
        <section key={d} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="oa-eyebrow" style={{ color: "var(--mute)", marginTop: 6 }}>{DAY[d]}</div>
          <div className="oa-card oa-list">
            {classes.filter((c) => c.day === d).map((c) => (
              <Link key={c.id} href={`/admin/classes/${c.id}`} className="oa-li">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async" src={classImage(c)} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: "cover", opacity: c.active ? 1 : 0.4 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{c.title}{!c.active && <span className="oa-meta"> · hidden</span>}</div>
                  <div className="oa-meta">{c.time} · {c.venue} · {c.capacity} places</div>
                </div>
                <span className="oa-ib" style={{ background: c.intensity === "high" ? "var(--gold)" : "var(--lo)", alignSelf: "center", height: 26 }} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

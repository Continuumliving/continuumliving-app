import Link from "next/link";
import { PageHead } from "@/components/admin/AdminShell";
import { loadAdminData } from "@/lib/admin";
import { nextOccurrenceISO } from "@/lib/dates";
import { DAY_NAMES } from "@/lib/format";

export const dynamic = "force-dynamic";

const WEEK = [1, 2, 3, 4, 5, 6, 0];

export default async function ClassesPage() {
  const { classes, bookings } = await loadAdminData();

  return (
    <>
      <PageHead
        eyebrow="— Programme"
        title={
          <>
            The weekly <em>programme.</em>
          </>
        }
        sub="Each card shows bookings for its next session. Open a class to edit it or manage the roster for any upcoming date."
        actions={
          <Link href="/admin/classes/new" className="bo-btn primary">
            New class
          </Link>
        }
      />

      {classes.length === 0 ? (
        <section className="bo-panel">
          <div className="bo-empty">
            No classes yet. <Link href="/admin/classes/new">Add the first one</Link>.
          </div>
        </section>
      ) : (
        <div className="bo-week">
          {WEEK.map((d) => {
            const day = classes.filter((c) => c.day === d);
            return (
              <div className="bo-day-col" key={d}>
                <div className="bo-day-name">{DAY_NAMES[d]}</div>
                {day.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--stone)", padding: "4px 2px" }}>—</div>
                ) : (
                  day.map((c) => {
                    const next = nextOccurrenceISO(c.day, c.time);
                    const taken = bookings.filter((b) => b.class_id === c.id && b.session_date === next).length;
                    return (
                      <Link
                        key={c.id}
                        href={`/admin/classes/${c.id}`}
                        className={`bo-class-card ${c.intensity}${c.active ? "" : " inactive"}`}
                      >
                        <div className="t">
                          {c.time} · {c.duration_min}′
                        </div>
                        <div className="n">{c.title}</div>
                        <div className="c">{c.coach}</div>
                        <div className="c" style={{ marginTop: 4 }}>
                          {c.active ? `${taken} / ${c.capacity} booked` : "Inactive"}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

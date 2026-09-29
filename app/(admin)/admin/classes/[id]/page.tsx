import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminAdd, CancelBookingButton, ExportButton } from "@/components/admin/AdminActions";
import { ClassForm } from "@/components/admin/AdminForms";
import { FillBar, PageHead } from "@/components/admin/AdminShell";
import { loadAdminData } from "@/lib/admin";
import { addDaysISO, formatStamp, fullName } from "@/lib/admin-format";
import { formatLongDate, formatShortDate, nextOccurrenceISO, todayMadridISO } from "@/lib/dates";
import { DAY_NAMES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { date?: string };
}) {
  const { profiles, classes, bookings } = await loadAdminData();
  const cls = classes.find((c) => c.id === params.id);
  if (!cls) notFound();

  const today = todayMadridISO();
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const classBookings = bookings.filter((b) => b.class_id === cls.id);

  // Session tabs: next four occurrences, plus any other future date that has bookings.
  const first = nextOccurrenceISO(cls.day, cls.time);
  const dates = new Set([0, 7, 14, 21].map((o) => addDaysISO(first, o)));
  classBookings.filter((b) => b.session_date >= today).forEach((b) => dates.add(b.session_date));
  const requested = searchParams.date && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date) ? searchParams.date : null;
  if (requested) dates.add(requested);
  const sessionDates = Array.from(dates).sort();
  const selected = requested ?? first;

  const roster = classBookings
    .filter((b) => b.session_date === selected)
    .map((b) => ({ b, p: profileById.get(b.profile_id) }))
    .sort((a, b) => a.b.created_at.localeCompare(b.b.created_at));
  const bookedIds = new Set(roster.map((r) => r.b.profile_id));
  const addOptions = profiles
    .filter((p) => !bookedIds.has(p.id))
    .map((p) => ({
      value: p.id,
      label: `${fullName(p)}${p.unit_number && p.unit_number !== "—" ? ` · ${p.unit_number}` : ""}`,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const pastCount = classBookings.filter((b) => b.session_date < today).length;
  const isPast = selected < today;

  return (
    <>
      <PageHead
        crumb={{ href: "/admin/classes", label: "Programme" }}
        eyebrow={`— ${DAY_NAMES[cls.day]} · ${cls.time}${cls.active ? "" : " · Inactive"}`}
        title={cls.title}
        sub={`${cls.venue} · ${cls.coach} · ${cls.duration_min} min · ${pastCount} past ${pastCount === 1 ? "booking" : "bookings"}`}
      />

      <div className="bo-grid-side">
        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Roster</h2>
            <ExportButton
              filename={`roster-${cls.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${selected}.csv`}
              headers={["Resident", "Email", "Unit", "Booked at"]}
              rows={roster.map(({ b, p }) => [fullName(p), p?.email ?? "", p?.unit_number ?? "", b.created_at])}
            />
          </div>
          <div className="bo-toolbar">
            <div className="bo-seg" role="group" aria-label="Session date" style={{ flexWrap: "wrap" }}>
              {sessionDates.map((d) => (
                <Link
                  key={d}
                  href={`/admin/classes/${cls.id}?date=${d}`}
                  className={d === selected ? "on" : ""}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    height: 34,
                    padding: "0 12px",
                    fontSize: 12,
                    textDecoration: "none",
                    background: d === selected ? "var(--ink)" : "#fff",
                    color: d === selected ? "var(--bone)" : "var(--stone-deep)",
                    borderRight: "0.5px solid var(--hair)",
                  }}
                >
                  {formatShortDate(d)}
                </Link>
              ))}
            </div>
            <span className="grow" />
            <FillBar taken={roster.length} capacity={cls.capacity} />
          </div>
          <div className="bo-panel-body" style={{ paddingBottom: 6 }}>
            <div className="bo-eyebrow">{formatLongDate(selected)}</div>
          </div>
          {roster.length === 0 ? (
            <div className="bo-empty">No one booked for this session yet.</div>
          ) : (
            <ul className="bo-list">
              {roster.map(({ b, p }, i) => (
                <li key={b.id}>
                  <div className="when">{i + 1}</div>
                  <div className="what">
                    <Link href={`/admin/residents/${b.profile_id}`}>{fullName(p)}</Link>
                    <div className="meta">
                      {p?.unit_number && p.unit_number !== "—" ? `Unit ${p.unit_number} · ` : ""}booked{" "}
                      {formatStamp(b.created_at)}
                    </div>
                  </div>
                  <div className="right">
                    {isPast ? null : <CancelBookingButton booking={b} who={fullName(p)} />}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!isPast && cls.active ? (
            <div className="bo-panel-body" style={{ borderTop: "0.5px solid var(--hair)" }}>
              <AdminAdd
                kind="booking"
                fixed={{ classId: cls.id, date: selected }}
                options={addOptions}
                placeholder="Add a resident to this session…"
                button="Book"
              />
              {roster.length >= cls.capacity ? (
                <p style={{ fontSize: 12, color: "var(--stone-deep)", marginTop: 8 }}>
                  This session is full — adding someone will take it over capacity.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="bo-panel">
          <div className="bo-panel-head">
            <h2 className="bo-panel-title">Edit class</h2>
          </div>
          <div className="bo-panel-body">
            <ClassForm initial={cls} />
          </div>
        </section>
      </div>
    </>
  );
}

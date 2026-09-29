import { PageHead } from "@/components/admin/AdminShell";
import { BookingsTable, type BookingLine } from "@/components/admin/BookingsTable";
import { loadAdminData } from "@/lib/admin";
import { fullName } from "@/lib/admin-format";
import { todayMadridISO } from "@/lib/dates";
import { DAY_SHORT } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const { profiles, classes, bookings } = await loadAdminData();
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const classById = new Map(classes.map((c) => [c.id, c]));

  const rows: BookingLine[] = bookings.map((b) => {
    const p = profileById.get(b.profile_id);
    const c = classById.get(b.class_id);
    return {
      id: b.id,
      profile_id: b.profile_id,
      class_id: b.class_id,
      session_date: b.session_date,
      created_at: b.created_at,
      name: fullName(p),
      email: p?.email ?? "",
      unit: p?.unit_number && p.unit_number !== "—" ? p.unit_number : "",
      classTitle: c?.title ?? "Retired class",
      time: c?.time ?? "",
      coach: c?.coach ?? "",
      venue: c?.venue ?? "",
    };
  });

  return (
    <>
      <PageHead
        eyebrow="— Bookings"
        title={
          <>
            Every class <em>booking.</em>
          </>
        }
        sub="Filter by class or resident, cancel on someone's behalf, or export the list for the coaches."
      />
      <BookingsTable
        rows={rows}
        today={todayMadridISO()}
        classes={classes.map((c) => ({ id: c.id, label: `${DAY_SHORT[c.day]} ${c.time} · ${c.title}` }))}
      />
    </>
  );
}

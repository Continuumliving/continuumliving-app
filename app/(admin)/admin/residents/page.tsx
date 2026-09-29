import { PageHead } from "@/components/admin/AdminShell";
import { ResidentsTable, type ResidentSummary } from "@/components/admin/ResidentsTable";
import { loadAdminData } from "@/lib/admin";
import { fullName } from "@/lib/admin-format";
import { todayMadridISO } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ResidentsPage() {
  const { profiles, bookings, rsvps } = await loadAdminData();
  const today = todayMadridISO();

  const rows: ResidentSummary[] = profiles.map((p) => {
    const mine = bookings.filter((b) => b.profile_id === p.id);
    const myRsvps = rsvps.filter((r) => r.profile_id === p.id);
    const stamps = [...mine.map((b) => b.created_at), ...myRsvps.map((r) => r.created_at)].sort();
    return {
      id: p.id,
      name: fullName(p),
      first_name: p.first_name ?? "",
      last_name: p.last_name ?? "",
      email: p.email ?? "",
      unit_number: p.unit_number && p.unit_number !== "—" ? p.unit_number : "",
      role: p.role,
      joined_at: p.joined_at,
      upcoming: mine.filter((b) => b.session_date >= today).length,
      sessions: mine.length,
      rsvps: myRsvps.length,
      lastActive: stamps.length ? stamps[stamps.length - 1] : null,
    };
  });

  return (
    <>
      <PageHead
        eyebrow="— Residents"
        title={
          <>
            Everyone in <em>the house.</em>
          </>
        }
        sub="Search, sort and export. Open a resident to edit their details, manage their bookings or change their role."
      />
      <ResidentsTable rows={rows} />
    </>
  );
}

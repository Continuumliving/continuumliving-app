import Link from "next/link";
import { getRequestClient } from "@/lib/auth-cache";
import { fmtDate, monthLabel, thisMonthStart } from "@/lib/brief";

export const dynamic = "force-dynamic";

export default async function AdminBriefs() {
  const sb = getRequestClient();
  const ws = thisMonthStart();
  const [people, profiles, briefs] = await Promise.all([
    sb.from("profiles").select("id, first_name, last_name, unit_number, role").order("first_name"),
    sb.from("health_profiles").select("resident_id, consent_at, next_review"),
    sb.from("weekly_briefs").select("resident_id, published").eq("week_start", ws),
  ]);
  const failed = !!(people.error || profiles.error || briefs.error);
  const hp = new Map((profiles.data ?? []).map((p) => [p.resident_id as string, p]));
  const wb = new Map((briefs.data ?? []).map((b) => [b.resident_id as string, b.published as boolean]));
  const residents = (people.data ?? []).filter((p) => p.role !== "admin");
  const done = residents.filter((r) => wb.get(r.id) === true).length;

  return (
    <main className="oa">
      <Link href="/admin" className="oa-back">‹ Admin</Link>
      <div>
        <div className="oa-eyebrow">Health briefs</div>
        <h1 className="oa-h1">{monthLabel(ws)}</h1>
        <div className="oa-sub" style={{ marginTop: 4 }}>{done} of {residents.length} published this month</div>
      </div>
      {failed && <div className="oa-card oa-empty"><p>Briefs could not be loaded. Has migration 0009 been run in Supabase?</p></div>}
      {!failed && residents.length === 0 && <div className="oa-card oa-empty"><p>No residents yet.</p></div>}
      {residents.length > 0 && (
        <div className="oa-card oa-list">
          {residents.map((r) => {
            const h = hp.get(r.id);
            const st = wb.get(r.id);
            const name = `${r.first_name} ${r.last_name}`.trim() || "Resident";
            return (
              <Link key={r.id} href={`/admin/briefs/${r.id}`} className="oa-li">
                <div className="oa-me" style={{ width: 40, height: 40, fontSize: 14 }}>{(name.charAt(0) || "R").toUpperCase()}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500 }}>{name}{r.unit_number && r.unit_number !== "—" ? ` · ${r.unit_number}` : ""}</div>
                  <div className="oa-meta">
                    {h?.consent_at ? "Consent given" : "No consent yet"}
                    {h?.next_review ? ` · review ${fmtDate(h.next_review)}` : ""}
                  </div>
                </div>
                <span className={`oa-status ${st === true ? "ok" : st === false ? "draft" : ""}`}>
                  {st === true ? "Published" : st === false ? "Draft" : "To write"}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}

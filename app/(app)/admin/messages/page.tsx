import Link from "next/link";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";
import { fetchInbox, timeLabel } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function AdminInbox() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  let rows: Awaited<ReturnType<typeof fetchInbox>> = [];
  let failed = false;
  try {
    rows = await fetchInbox(getRequestClient(), profile.id);
  } catch {
    failed = true;
  }
  const unread = rows.reduce((n, r) => n + r.unread, 0);

  return (
    <main className="oa">
      <Link href="/admin" className="oa-back">‹ Admin</Link>
      <div>
        <div className="oa-eyebrow">Coach inbox</div>
        <h1 className="oa-h1">Messages</h1>
        <div className="oa-sub" style={{ marginTop: 4 }}>{unread > 0 ? `${unread} unread` : "All caught up"}</div>
      </div>
      {failed && (
        <div className="oa-card oa-empty"><p>The inbox could not be loaded. Has migration 0007 been run in Supabase?</p></div>
      )}
      {!failed && rows.length === 0 && (
        <div className="oa-card oa-empty"><p>No conversations yet. When a resident writes from the Coach tab, it appears here.</p></div>
      )}
      {rows.length > 0 && (
        <div className="oa-card oa-list">
          {rows.map((r) => (
            <Link key={r.resident_id} href={`/admin/messages/${r.resident_id}`} className="oa-li">
              <div className="oa-me" style={{ width: 40, height: 40, fontSize: 14 }}>{(r.name.charAt(0) || "R").toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="oa-row">
                  <span style={{ fontWeight: 500 }}>{r.name}{r.unit && r.unit !== "—" ? ` · ${r.unit}` : ""}</span>
                  <span className="oa-meta">{timeLabel(r.last.created_at)}</span>
                </div>
                <div className="oa-meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                  {r.last.sender_id === profile.id ? "You: " : ""}{r.last.body}
                </div>
              </div>
              {r.unread > 0 && <span className="oa-badge">{r.unread}</span>}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

import { NextResponse, type NextRequest } from "next/server";
import webpush from "web-push";
import { getServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BGSXDOLSjnWBasGVBCpVllrF9aLkFrmxiLLQCSnrhmBYAKgmJkSyP6y4a5Km50tTGxOwPTzncpamJF-q2jqAEh8";

export async function POST(req: NextRequest) {
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!priv) return NextResponse.json({ sent: 0, reason: "push not configured" });

  let body: { residentId?: string; preview?: string; kind?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const residentId = body.residentId;
  if (!residentId || !/^[0-9a-f-]{36}$/i.test(residentId)) {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }

  const supabase = getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const me = auth.user;
  if (!me) return NextResponse.json({ error: "unauthorised" }, { status: 401 });

  const [{ data: targets, error }, { data: sender }] = await Promise.all([
    supabase.rpc("push_targets_for_thread", { p_resident: residentId }),
    supabase.from("profiles").select("first_name, role").eq("id", me.id).maybeSingle(),
  ]);
  if (error) return NextResponse.json({ sent: 0, reason: "lookup failed" });

  const fromCoach = sender?.role === "admin" && me.id !== residentId;
  const isBrief = body.kind === "brief";
  if (isBrief && !fromCoach) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const payload = JSON.stringify(
    isBrief
      ? { title: "Your monthly brief is ready", body: "Your coach has written up your month.", url: "/brief", tag: `brief-${residentId}` }
      : {
          title: fromCoach ? "Your coach replied" : `New message from ${sender?.first_name || "a resident"}`,
          body: (body.preview || "").toString().slice(0, 140),
          url: fromCoach ? "/coach" : `/admin/messages/${residentId}`,
          tag: `thread-${residentId}`,
        },
  );

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:tomash@continuumliving.eu", PUBLIC, priv);

  let sent = 0;
  await Promise.all(
    ((targets ?? []) as Array<{ endpoint: string; p256dh: string; auth: string }>).map(async (t) => {
      try {
        await webpush.sendNotification({ endpoint: t.endpoint, keys: { p256dh: t.p256dh, auth: t.auth } }, payload, { TTL: 86400 });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await supabase.rpc("drop_push_endpoint", { p_endpoint: t.endpoint });
      }
    }),
  );
  return NextResponse.json({ sent });
}

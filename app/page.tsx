import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  // Be defensive — if env is missing or Supabase is unreachable we
  // still send the visitor to /signin instead of throwing a 500
  // from the homepage.
  let user: { id: string } | null = null;
  try {
    const supabase = getServerClient();
    const res = await supabase.auth.getUser();
    user = res.data.user ?? null;
  } catch (err) {
    console.error("[/] auth.getUser failed:", err);
  }
  redirect(user ? "/today" : "/signin");
}

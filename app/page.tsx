import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/today" : "/signin");
}

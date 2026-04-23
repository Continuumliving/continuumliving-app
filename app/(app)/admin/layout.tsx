import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { fetchMyProfile, isAdmin } from "@/lib/profile";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServerClient();
  const profile = await fetchMyProfile(supabase);
  if (!profile) redirect("/signin");
  if (!isAdmin(profile)) redirect("/account");
  return <>{children}</>;
}

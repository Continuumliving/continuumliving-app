import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth-cache";
import { isAdmin } from "@/lib/profile";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");
  if (!isAdmin(profile)) redirect("/account");
  return <>{children}</>;
}

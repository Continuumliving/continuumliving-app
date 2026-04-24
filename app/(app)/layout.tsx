import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { getCurrentProfile } from "@/lib/auth-cache";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // One cached call — every page inside the group that also asks for
  // the profile (via getCurrentProfile) will reuse this result rather
  // than re-hitting auth.supabase.co and re-SELECTing profiles.
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin");

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}

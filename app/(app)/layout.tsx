import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { getServerClient } from "@/lib/supabase/server";
import { ensureMyProfile } from "@/lib/profile";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  // Self-heal: if the DB trigger failed to create a profile row (for
  // any reason — enum cast, transient error, predates the migration),
  // create one now from auth user_metadata before rendering any page.
  try {
    await ensureMyProfile(supabase);
  } catch (err) {
    console.error("ensureMyProfile failed:", err);
  }

  return (
    <ToastProvider>
      <AppShell>{children}</AppShell>
    </ToastProvider>
  );
}

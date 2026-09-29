import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { ToastProvider } from "@/components/Toast";
import { getCurrentProfile, getRequestClient } from "@/lib/auth-cache";
import { isAdmin } from "@/lib/profile";
import { todayMadridISO } from "@/lib/dates";
import "./admin.css";

export const metadata: Metadata = {
  title: "Back office · Continuum Living",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

async function count(
  q: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count: n, error } = await q;
    if (error) return 0;
    return n ?? 0;
  } catch {
    return 0;
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/signin?next=/admin");
  if (!isAdmin(profile)) redirect("/today");

  const supabase = getRequestClient();
  const today = todayMadridISO();
  const [residents, bookings, classes, events] = await Promise.all([
    count(supabase.from("profiles").select("id", { count: "exact", head: true })),
    count(
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .gte("session_date", today),
    ),
    count(
      supabase.from("classes").select("id", { count: "exact", head: true }).eq("active", true),
    ),
    count(
      supabase.from("events").select("id", { count: "exact", head: true }).gte("date", today),
    ),
  ]);

  return (
    <ToastProvider>
      <AdminShell counts={{ residents, bookings, classes, events }} email={profile.email}>
        {children}
      </AdminShell>
    </ToastProvider>
  );
}

import { ClassesView } from "@/components/ClassesView";
import { getServerClient } from "@/lib/supabase/server";
import { fetchAllClasses } from "@/lib/classes";
import { fetchMyBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const supabase = getServerClient();
  const [classes, bookings] = await Promise.all([
    fetchAllClasses(supabase),
    fetchMyBookings(supabase),
  ]);
  const bookedKeys = bookings.map((b) => `${b.class_id}|${b.session_date}`);
  return <ClassesView classes={classes} bookedKeys={bookedKeys} />;
}

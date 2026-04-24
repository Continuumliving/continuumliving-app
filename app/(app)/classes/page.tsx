import { ClassesView } from "@/components/ClassesView";
import { getRequestClient } from "@/lib/auth-cache";
import { fetchAllClasses } from "@/lib/classes";
import { fetchMyBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const supabase = getRequestClient();
  const [classes, bookings] = await Promise.all([
    fetchAllClasses(supabase),
    fetchMyBookings(supabase),
  ]);
  const bookedKeys = bookings.map((b) => `${b.class_id}|${b.session_date}`);
  return <ClassesView classes={classes} bookedKeys={bookedKeys} />;
}

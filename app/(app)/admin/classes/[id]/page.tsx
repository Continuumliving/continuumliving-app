import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminClassForm } from "@/components/AdminClassForm";
import { getRequestClient } from "@/lib/auth-cache";
import type { ClassRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditClassPage({ params }: { params: { id: string } }) {
  const { data, error } = await getRequestClient().from("classes").select("*").eq("id", params.id).maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const cls = data as ClassRow;
  return (
    <main className="oa">
      <Link href="/admin/classes" className="oa-back">‹ Classes</Link>
      <div><div className="oa-eyebrow">Edit class</div><h1 className="oa-h1">{cls.title}</h1></div>
      <AdminClassForm initial={cls} />
    </main>
  );
}

import { notFound } from "next/navigation";
import { AdminClassForm } from "@/components/AdminClassForm";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";
import { getServerClient } from "@/lib/supabase/server";
import type { ClassRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditClassPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getServerClient();
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const cls = data as ClassRow;

  return (
    <div className="screen">
      <BackButton href="/admin/classes">Back to programme</BackButton>
      <HeroNameCard
        eyebrow="— Edit class"
        title={
          <>
            {cls.title}
            <br />
            <em>in the programme.</em>
          </>
        }
      />
      <AdminClassForm initial={cls} />
    </div>
  );
}

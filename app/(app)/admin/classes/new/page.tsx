import { AdminClassForm } from "@/components/AdminClassForm";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";

export default function NewClassPage() {
  return (
    <div className="screen">
      <BackButton href="/admin/classes">Back to programme</BackButton>
      <HeroNameCard
        eyebrow="— New class"
        title={
          <>
            Add to the
            <br />
            <em>programme.</em>
          </>
        }
      />
      <AdminClassForm />
    </div>
  );
}

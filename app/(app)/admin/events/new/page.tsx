import { AdminEventForm } from "@/components/AdminEventForm";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";

export default function NewEventPage() {
  return (
    <div className="screen">
      <BackButton href="/admin/events">Back to calendar</BackButton>
      <HeroNameCard
        tone="olive"
        eyebrow="— New event"
        title={
          <>
            Add to the
            <br />
            <em style={{ color: "var(--olive)" }}>calendar.</em>
          </>
        }
      />
      <AdminEventForm />
    </div>
  );
}

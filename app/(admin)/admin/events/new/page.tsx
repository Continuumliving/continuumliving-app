import { PageHead } from "@/components/admin/AdminShell";
import { EventForm } from "@/components/admin/AdminForms";

export default function NewEventPage() {
  return (
    <>
      <PageHead
        crumb={{ href: "/admin/events", label: "Events" }}
        eyebrow="— New event"
        title={
          <>
            Add to the <em>calendar.</em>
          </>
        }
        sub="Residents can reserve a place straight away, up to the capacity you set."
      />
      <section className="bo-panel" style={{ maxWidth: 760 }}>
        <div className="bo-panel-body">
          <EventForm />
        </div>
      </section>
    </>
  );
}

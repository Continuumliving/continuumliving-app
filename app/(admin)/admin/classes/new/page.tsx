import { PageHead } from "@/components/admin/AdminShell";
import { ClassForm } from "@/components/admin/AdminForms";

export default function NewClassPage() {
  return (
    <>
      <PageHead
        crumb={{ href: "/admin/classes", label: "Programme" }}
        eyebrow="— New class"
        title={
          <>
            Add to the <em>programme.</em>
          </>
        }
        sub="Classes repeat weekly on the chosen day. Residents see it as soon as it's active."
      />
      <section className="bo-panel" style={{ maxWidth: 760 }}>
        <div className="bo-panel-body">
          <ClassForm />
        </div>
      </section>
    </>
  );
}

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { HeroNameCard } from "@/components/HeroNameCard";
import { Row } from "@/components/Row";

export default function AdminIndex() {
  return (
    <div className="screen">
      <BackButton href="/account">Back to account</BackButton>

      <HeroNameCard
        eyebrow="— Administration"
        title={
          <>
            The house,
            <br />
            <em>curated.</em>
          </>
        }
        intro="Manage the weekly programme and the seasonal calendar. Edits are visible to all residents immediately."
      />

      <div style={{ marginTop: 12 }}>
        <Row
          href="/admin/classes"
          accent="terracotta"
          title="Weekly programme"
          subtitle="Add, edit, or retire classes"
          aside="Manage"
        />
        <Row
          href="/admin/events"
          accent="olive"
          asideTone="olive"
          title="Seasonal calendar"
          subtitle="Curate upcoming gatherings"
          aside="Manage"
        />
      </div>

      <p
        style={{
          marginTop: 28,
          fontFamily: "var(--serif)",
          fontStyle: "italic",
          color: "var(--stone-deep)",
          textAlign: "center",
          fontSize: 13,
        }}
      >
        Please measure twice before publishing.
      </p>

      <div style={{ marginTop: 20 }}>
        <Link href="/admin/classes/new" className="btn btn-terracotta">
          New class
        </Link>
      </div>
      <div style={{ marginTop: 10 }}>
        <Link href="/admin/events/new" className="btn btn-olive">
          New event
        </Link>
      </div>
    </div>
  );
}

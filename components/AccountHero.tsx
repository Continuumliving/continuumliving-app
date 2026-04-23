import type { Development } from "@/lib/types";

interface AccountHeroProps {
  firstName: string;
  lastName: string;
  unit: string;
  email: string;
  development: {
    id: Development;
    name: string;
    location: string;
  };
}

export function AccountHero({
  firstName,
  lastName,
  unit,
  email,
  development,
}: AccountHeroProps) {
  const chipClass = development.id === "alcantara" ? "dev-chip olive" : "dev-chip";
  return (
    <div className="account-hero">
      <div className={chipClass}>{development.location}</div>
      <h1 className="h1">
        {firstName}
        <br />
        <em>{lastName || ""}.</em>
      </h1>
      <div className="meta">
        {unit} · {development.name}
      </div>
      <div className="email">{email}</div>
    </div>
  );
}

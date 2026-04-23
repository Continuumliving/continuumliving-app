import type { ReactNode } from "react";

interface HeroNameCardProps {
  eyebrow: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "terracotta" | "olive";
}

export function HeroNameCard({
  eyebrow,
  title,
  intro,
  tone = "terracotta",
}: HeroNameCardProps) {
  const borderColor = tone === "olive" ? "var(--olive)" : "var(--terracotta)";
  const eyebrowClass = tone === "olive" ? "eyebrow olive" : "eyebrow";
  return (
    <div
      className="hero-name-card"
      style={{ borderLeftColor: borderColor }}
    >
      <div className={eyebrowClass}>{eyebrow}</div>
      <h1 className="h1">{title}</h1>
      {intro ? (
        <p className="body-md" style={{ marginTop: 16, maxWidth: 360 }}>
          {intro}
        </p>
      ) : null}
    </div>
  );
}

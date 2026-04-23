import Link from "next/link";
import type { ReactNode } from "react";

interface RowProps {
  href?: string;
  accent?: "terracotta" | "olive" | "none";
  title: ReactNode;
  subtitle?: ReactNode;
  aside?: ReactNode;
  asideTone?: "terracotta" | "olive";
  staticRow?: boolean;
}

export function Row({
  href,
  accent = "terracotta",
  title,
  subtitle,
  aside,
  asideTone = "terracotta",
  staticRow,
}: RowProps) {
  const cls = `row${accent === "terracotta" ? " accent" : accent === "olive" ? " olive" : ""}${staticRow ? " static" : ""}`;
  const inner = (
    <>
      <div className="row-main">
        <div className="session-title">{title}</div>
        {subtitle ? <div className="session-location">{subtitle}</div> : null}
      </div>
      {aside ? (
        <div className={`row-aside${asideTone === "olive" ? " olive" : ""}`}>
          {aside}
        </div>
      ) : null}
    </>
  );

  if (href && !staticRow) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

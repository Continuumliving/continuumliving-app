import Link from "next/link";
import type { ReactNode } from "react";

export function BackButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="back">
      {children}
    </Link>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TabIcons } from "./oa/Icons";

const TABS = [
  { id: "home", label: "Home", href: "/today", match: (p: string) => p === "/today" || p.startsWith("/account") || p.startsWith("/admin") },
  { id: "classes", label: "Classes", href: "/classes", match: (p: string) => p.startsWith("/classes") },
  { id: "brief", label: "Brief", href: "/brief", match: (p: string) => p.startsWith("/brief") },
  { id: "events", label: "Events", href: "/events", match: (p: string) => p.startsWith("/events") },
  { id: "coach", label: "Coach", href: "/coach", match: (p: string) => p.startsWith("/coach") },
] as const;

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="tab-bar" aria-label="Primary">
      <div className="tab-inner">
        {TABS.map((t) => {
          const active = t.match(pathname);
          return (
            <Link key={t.id} href={t.href} className={`tab${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{TabIcons[t.id]}</svg>
              <span className="tab-label">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

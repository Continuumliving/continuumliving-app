"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabId = "today" | "classes" | "events" | "account";

interface Tab {
  id: TabId;
  label: string;
  href: string;
  matches: (pathname: string) => boolean;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  {
    id: "today",
    label: "Today",
    href: "/today",
    matches: (p) => p === "/today",
    icon: (
      <path
        d="M3 8 L9 3 L15 8 V14 H3 Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    ),
  },
  {
    id: "classes",
    label: "Classes",
    href: "/classes",
    matches: (p) => p.startsWith("/classes"),
    icon: (
      <>
        <rect
          x="3"
          y="4"
          width="12"
          height="11"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <line x1="3" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1" />
        <line x1="6" y1="2" x2="6" y2="5" stroke="currentColor" strokeWidth="1" />
        <line x1="12" y1="2" x2="12" y2="5" stroke="currentColor" strokeWidth="1" />
      </>
    ),
  },
  {
    id: "events",
    label: "Events",
    href: "/events",
    matches: (p) => p.startsWith("/events"),
    icon: (
      <>
        <path
          d="M3 14 Q9 5 15 14"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <circle
          cx="9"
          cy="4"
          r="1.5"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </>
    ),
  },
  {
    id: "account",
    label: "Account",
    href: "/account",
    matches: (p) => p.startsWith("/account") || p.startsWith("/admin"),
    icon: (
      <>
        <circle
          cx="9"
          cy="6"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
        <path
          d="M3 15 Q9 10 15 15"
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
        />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="tab-bar" aria-label="Primary">
      {TABS.map((t) => {
        const active = t.matches(pathname);
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`tab${active ? " active" : ""}`}
          >
            <svg viewBox="0 0 18 18" aria-hidden="true">
              {t.icon}
            </svg>
            <span className="tab-label">{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

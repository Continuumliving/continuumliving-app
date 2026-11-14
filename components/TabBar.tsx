"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TabIcons } from "./oa/Icons";
import { useProfile } from "@/lib/data-context";
import { useUnread } from "@/lib/unread";

const TABS = [
  { id: "home", label: "Home", href: "/today", match: (p: string) => p === "/today" || p.startsWith("/account") || p.startsWith("/admin") },
  { id: "classes", label: "Classes", href: "/classes", match: (p: string) => p.startsWith("/classes") },
  { id: "brief", label: "Brief", href: "/brief", match: (p: string) => p.startsWith("/brief") },
  { id: "events", label: "Events", href: "/events", match: (p: string) => p.startsWith("/events") },
  { id: "coach", label: "Coach", href: "/coach", match: (p: string) => p.startsWith("/coach") },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const profile = useProfile();
  const unread = useUnread();
  const isCoach = profile?.role === "admin";
  return (
    <nav className="tab-bar" aria-label="Primary">
      <div className="tab-inner">
        {TABS.map((t) => {
          const coachHref: Record<string, string> = { coach: "/admin/messages", brief: "/admin/briefs" };
          const href = isCoach && coachHref[t.id] ? coachHref[t.id] : t.href;
          const inCoachArea = pathname.startsWith("/admin/messages") || pathname.startsWith("/admin/briefs");
          const active = isCoach && coachHref[t.id]
            ? pathname.startsWith(coachHref[t.id]) || (t.id === "brief" && pathname.startsWith("/brief"))
            : t.id === "home" && inCoachArea ? false : t.match(pathname);
          const label = t.id === "coach" && isCoach ? "Inbox" : t.id === "brief" && isCoach ? "Briefs" : t.label;
          return (
            <Link key={t.id} href={href} className={`tab${active ? " active" : ""}`} aria-current={active ? "page" : undefined}>
              <svg viewBox="0 0 24 24" aria-hidden="true">{TabIcons[t.id]}</svg>
              {t.id === "coach" && unread > 0 && <span className="tab-dot" aria-label={`${unread} unread`}>{unread > 9 ? "9+" : unread}</span>}
              <span className="tab-label">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { getBrowserClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  count?: number;
}

export function AdminShell({
  children,
  counts,
  email,
}: {
  children: ReactNode;
  counts: { residents: number; bookings: number; classes: number; events: number };
  email: string;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const nav: NavItem[] = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/residents", label: "Residents", count: counts.residents },
    { href: "/admin/bookings", label: "Bookings", count: counts.bookings },
    { href: "/admin/classes", label: "Programme", count: counts.classes },
    { href: "/admin/events", label: "Events", count: counts.events },
  ];

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  async function signOut() {
    if (!window.confirm("Sign out of Continuum Living?")) return;
    await getBrowserClient().auth.signOut();
    router.replace("/signin");
    router.refresh();
  }

  return (
    <div className="bo">
      <aside className="bo-side">
        <Link href="/admin" className="bo-brand">
          Continuum <em>Living</em>
        </Link>
        <div className="bo-brand-sub">Back office</div>
        <nav className="bo-nav" aria-label="Admin">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "active" : undefined}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <span>{item.label}</span>
              {typeof item.count === "number" ? (
                <span className="count">{item.count}</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="bo-side-foot">
          <Link href="/today">Open resident app ↗</Link>
          <button type="button" onClick={signOut}>
            Sign out
          </button>
          <div className="bo-me">{email}</div>
        </div>
      </aside>
      <main className="bo-main">{children}</main>
    </div>
  );
}

export function PageHead({
  eyebrow,
  title,
  sub,
  actions,
  crumb,
}: {
  eyebrow: string;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
  crumb?: { href: string; label: string };
}) {
  return (
    <>
      {crumb ? (
        <Link href={crumb.href} className="bo-crumb">
          ← {crumb.label}
        </Link>
      ) : null}
      <div className="bo-head">
        <div>
          <div className="bo-eyebrow">{eyebrow}</div>
          <h1 className="bo-title">{title}</h1>
          {sub ? <p className="bo-sub">{sub}</p> : null}
        </div>
        {actions ? <div className="bo-actions">{actions}</div> : null}
      </div>
    </>
  );
}

export function FillBar({ taken, capacity }: { taken: number; capacity: number }) {
  const pct = capacity > 0 ? Math.min(100, Math.round((taken / capacity) * 100)) : 0;
  const full = taken >= capacity;
  return (
    <div className="bo-fill" title={`${taken} of ${capacity}`}>
      <div className="bo-fill-track">
        <div className={`bo-fill-bar${full ? " full" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="bo-fill-label">
        {taken} / {capacity}
        {full ? " · full" : ""}
      </div>
    </div>
  );
}

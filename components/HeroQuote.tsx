import type { ReactNode } from "react";

export function HeroQuote({ children }: { children: ReactNode }) {
  return <div className="hero-quote">{children}</div>;
}

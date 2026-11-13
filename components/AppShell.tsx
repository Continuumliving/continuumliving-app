import type { ReactNode } from "react";
import { TabBar } from "./TabBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      {children}
      <TabBar />
    </div>
  );
}

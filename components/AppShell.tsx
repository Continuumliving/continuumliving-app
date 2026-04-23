import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";
import { TabBar } from "./TabBar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <StatusBar />
      {children}
      <TabBar />
    </div>
  );
}

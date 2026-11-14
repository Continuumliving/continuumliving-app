import type { ReactNode } from "react";
import { TabBar } from "./TabBar";
import { InstallPrompt } from "./oa/InstallPrompt";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      {children}
      <TabBar />
      <InstallPrompt />
    </div>
  );
}

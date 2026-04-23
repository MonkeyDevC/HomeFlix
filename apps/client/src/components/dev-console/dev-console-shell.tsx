"use client";

import type { ReactNode } from "react";
import { DevConsoleSidebar } from "./dev-console-sidebar";
import { DevConsoleTopbar } from "./dev-console-topbar";

export function DevConsoleShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="hdc-layout">
      <DevConsoleSidebar />
      <div className="hdc-main">
        <DevConsoleTopbar />
        <div className="hdc-content">{children}</div>
      </div>
    </div>
  );
}

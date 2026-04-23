import type { ReactNode } from "react";

export function AdminInfoHint({
  children,
  tone = "info"
}: Readonly<{
  children: ReactNode;
  tone?: "info" | "muted";
}>) {
  return <p className={`hf-admin-info-hint${tone === "muted" ? " is-muted" : ""}`}>{children}</p>;
}

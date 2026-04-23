import type { ReactNode } from "react";

export function DevAdminGate({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}

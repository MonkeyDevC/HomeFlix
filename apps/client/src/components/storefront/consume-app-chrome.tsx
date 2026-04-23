"use client";

import type { ReactNode } from "react";
import { ProfileSessionProvider } from "./profile-context";
import { StorefrontShell } from "./storefront-shell";

export function ConsumeAppChrome({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ProfileSessionProvider>
      <StorefrontShell>{children}</StorefrontShell>
    </ProfileSessionProvider>
  );
}

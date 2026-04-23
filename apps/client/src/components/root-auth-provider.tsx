"use client";

import type { ReactNode } from "react";

export function RootAuthProvider({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return <>{children}</>;
}

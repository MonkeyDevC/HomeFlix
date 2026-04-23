import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  description: "Acceso HomeFlix Family V1.",
  title: "HomeFlix · Acceso"
};

export default function AuthShellLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="hf-auth-root">{children}</div>;
}

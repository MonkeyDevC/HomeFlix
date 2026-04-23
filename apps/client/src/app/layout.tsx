import type { Metadata } from "next";
import { RootAuthProvider } from "../components/root-auth-provider";
import { SileoHost } from "../components/sileo-host";
import "./globals.css";

export const metadata: Metadata = {
  title: "HomeFlix",
  description:
    "HomeFlix Family V1 (objetivo): monolito Next + Prisma, sin Directus/Mux. El repo aún incluye legado V2 (API Fastify, Mux) hasta migración; ver docs/family-v1/."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <RootAuthProvider>
          <SileoHost />
          {children}
        </RootAuthProvider>
      </body>
    </html>
  );
}

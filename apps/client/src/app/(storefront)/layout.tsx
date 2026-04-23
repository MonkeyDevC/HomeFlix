import type { Metadata } from "next";
import { headers } from "next/headers";
import { ConsumeAppChrome } from "../../components/storefront/consume-app-chrome";
import { requireStorefrontAccess } from "../../lib/server/auth/require-storefront-context";

export const metadata: Metadata = {
  description:
    "Storefront Family V1: catálogo y detalle filtrados por perfil activo.",
  title: "HomeFlix · Catálogo"
};

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = await headers();
  const pathname = h.get("x-pathname") ?? "/";
  const isLegacyLogin = pathname === "/login" || pathname.startsWith("/login/");

  if (!isLegacyLogin) {
    await requireStorefrontAccess(pathname);
  }

  return <ConsumeAppChrome>{children}</ConsumeAppChrome>;
}

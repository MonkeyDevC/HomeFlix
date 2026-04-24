import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "../../../../../components/family-auth/admin-login-form";
import { BackofficeLoginShell } from "../../../../../components/family-auth/backoffice-login-shell";
import { getActiveProfileSummary } from "../../../../../lib/server/auth/active-profile";
import { getFamilySession } from "../../../../../lib/server/auth/get-family-session";
import "./backoffice-login.css";

export const metadata: Metadata = {
  description: "Acceso administración HomeFlix (backoffice).",
  title: "HomeFlix · Backoffice"
};

export const dynamic = "force-dynamic";

type Search = { next?: string | string[] };

function AdminLoginFallback(): ReactNode {
  return (
    <div className="hf-bo-form-inner">
      <p style={{ color: "rgba(148,163,184,0.95)", margin: 0, textAlign: "center" }}>Cargando…</p>
    </div>
  );
}

export default async function AdminAuthLoginPage({
  searchParams
}: Readonly<{
  searchParams: Promise<Search>;
}>) {
  const user = await getFamilySession();
  const sp = await searchParams;
  const nextRaw = sp.next;
  const nextSingle = Array.isArray(nextRaw) ? nextRaw[0] : nextRaw;
  const nextPath =
    typeof nextSingle === "string" && nextSingle.startsWith("/") && !nextSingle.startsWith("//")
      ? nextSingle
      : "/admin";

  if (user !== null) {
    if (user.role !== "admin") {
      redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
    }

    const active = await getActiveProfileSummary();
    if (active !== null) {
      redirect(nextPath);
    }

    redirect(`/auth/select-profile?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <BackofficeLoginShell>
      <Suspense fallback={<AdminLoginFallback />}>
        <AdminLoginForm />
      </Suspense>
    </BackofficeLoginShell>
  );
}

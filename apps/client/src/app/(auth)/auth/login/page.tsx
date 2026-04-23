import { Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { CinematicLoginShell } from "../../../../components/family-auth/cinematic-login-shell";
import { FamilyLoginForm } from "../../../../components/family-auth/login-form";
import { getActiveProfileSummary } from "../../../../lib/server/auth/active-profile";
import { getFamilySession } from "../../../../lib/server/auth/get-family-session";

export const dynamic = "force-dynamic";

type Search = { next?: string | string[] };

function LoginFallback(): ReactNode {
  return (
    <div className="hf-login-card hf-login-glass hf-login-card--skeleton">
      <p className="hf-login-subtitle" style={{ margin: 0 }}>
        Cargando formulario…
      </p>
    </div>
  );
}

export default async function AuthLoginPage({
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
      : "/";

  if (user !== null) {
    const active = await getActiveProfileSummary();

    if (active !== null) {
      redirect(nextPath);
    }

    redirect(`/auth/select-profile?next=${encodeURIComponent(nextPath)}`);
  }

  return (
    <CinematicLoginShell>
      <Suspense fallback={<LoginFallback />}>
        <FamilyLoginForm />
      </Suspense>
    </CinematicLoginShell>
  );
}

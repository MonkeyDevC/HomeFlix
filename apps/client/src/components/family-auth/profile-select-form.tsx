"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type ProfileSelectRow = Readonly<{
  id: string;
  displayName: string;
  avatarKey: string | null;
}>;

export function ProfileSelectForm({
  profiles,
  nextPath
}: Readonly<{
  profiles: readonly ProfileSelectRow[];
  nextPath: string;
}>) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const choose = (profileId: string) => {
    setError(null);
    setPendingId(profileId);

    void (async () => {
      const res = await fetch("/api/family/auth/active-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId })
      });

      if (!res.ok) {
        setError("No se pudo activar el perfil.");
        setPendingId(null);
        return;
      }

      router.push(nextPath);
      router.refresh();
    })();
  };

  return (
    <div className="sf-profiles-screen">
      <header className="sf-profiles-bar">
        <Link className="sf-profiles-bar-logo" href="/">
          HOMEFLIX
        </Link>
        <button className="sf-profiles-bar-manage sf-profiles-bar-manage--faux" disabled type="button">
          Gestionar perfiles
        </button>
      </header>

      <main className="sf-profiles-main">
        <div className="sf-profiles-inner">
          <header className="sf-profiles-head">
            <h1 className="sf-profiles-title">¿Quién está viendo?</h1>
            <p className="sf-profiles-subtitle">Selecciona un perfil para continuar</p>
          </header>

          {error !== null ? (
            <p className="hf-login-error" role="alert">
              {error}
            </p>
          ) : null}

          <ul className="sf-profiles-grid">
            {profiles.map((profile) => (
              <li key={profile.id}>
                <button
                  className="sf-profiles-card"
                  disabled={pendingId !== null}
                  onClick={() => {
                    choose(profile.id);
                  }}
                  type="button"
                >
                  <span className="sf-profiles-avatar-box">
                    <span aria-hidden="true" className="sf-profiles-avatar-initial">
                      {(profile.displayName.slice(0, 1) || "?").toUpperCase()}
                    </span>
                  </span>
                  <span className="sf-profiles-card-name">
                    {pendingId === profile.id ? "Activando..." : profile.displayName}
                  </span>
                </button>
              </li>
            ))}

            <li>
              <button
                className="sf-profiles-card sf-profiles-card--add"
                disabled
                title="Próximamente en Family V1"
                type="button"
              >
                <span className="sf-profiles-avatar-box sf-profiles-avatar-box--dashed">
                  <span aria-hidden="true" className="sf-profiles-add-glyph">
                    +
                  </span>
                </span>
                <span className="sf-profiles-card-name">Agregar perfil</span>
              </button>
            </li>
          </ul>

          <div className="sf-profiles-actions">
            <button className="sf-profiles-admin-btn" disabled title="Próximamente en Family V1" type="button">
              Administrar perfiles
            </button>
          </div>
        </div>
      </main>

      <footer className="sf-profiles-legal" aria-label="Enlaces informativos">
        <nav className="sf-profiles-legal-links">
          <span className="sf-profiles-legal-faux">Privacidad</span>
          <span className="sf-profiles-legal-faux">Términos de uso</span>
          <span className="sf-profiles-legal-faux">Centro de ayuda</span>
          <span className="sf-profiles-legal-faux">Cookies</span>
        </nav>
        <p className="sf-profiles-legal-copy">© {new Date().getFullYear()} HomeFlix · Family V1</p>
      </footer>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useProfileSession } from "./profile-context";
import { EmptyStateBlock } from "./empty-state-block";
import { ErrorStateBlock } from "./error-state-block";

function hueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

export function ProfileSelectorSurface() {
  const router = useRouter();
  const {
    profiles,
    activeProfileId,
    setActiveProfileId,
    loading,
    errorMessage
  } = useProfileSession();
  const [selectingId, setSelectingId] = useState<string | null>(null);

  async function handleSelectProfile(profileId: string) {
    if (selectingId !== null) {
      return;
    }
    setSelectingId(profileId);
    try {
      const ok = await setActiveProfileId(profileId);
      if (ok) {
        router.push("/");
        router.refresh();
      }
    } finally {
      setSelectingId(null);
    }
  }

  if (errorMessage !== null) {
    return (
      <div className="sf-profiles-screen">
        <header className="sf-profiles-bar">
          <Link className="sf-profiles-bar-logo" href="/">
            HOMEFLIX
          </Link>
        </header>
        <div className="sf-profiles-main sf-profiles-main--compact">
          <ErrorStateBlock message={errorMessage} title="No se pudieron cargar los perfiles" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="sf-profiles-screen">
        <header className="sf-profiles-bar">
          <Link className="sf-profiles-bar-logo" href="/">
            HOMEFLIX
          </Link>
          <span className="sf-profiles-bar-manage sf-profiles-bar-manage--faux">Gestionar perfiles</span>
        </header>
        <div className="sf-profiles-main">
          <p className="sf-profiles-loading">Cargando perfiles…</p>
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="sf-profiles-screen">
        <header className="sf-profiles-bar">
          <Link className="sf-profiles-bar-logo" href="/">
            HOMEFLIX
          </Link>
        </header>
        <div className="sf-profiles-main sf-profiles-main--compact">
          <EmptyStateBlock
            description="Crea perfiles vía API/Prisma o seed para habilitar el selector."
            title="Sin perfiles en la base"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="sf-profiles-screen">
      <header className="sf-profiles-bar">
        <Link className="sf-profiles-bar-logo" href="/">
          HOMEFLIX
        </Link>
        <button
          className="sf-profiles-bar-manage sf-profiles-bar-manage--faux"
          disabled
          title="Próximamente en Family V1"
          type="button"
        >
          Gestionar perfiles
        </button>
      </header>

      <main className="sf-profiles-main">
        <div className="sf-profiles-inner">
          <header className="sf-profiles-head">
            <h1 className="sf-profiles-title">¿Quién está viendo?</h1>
            <p className="sf-profiles-subtitle">Selecciona un perfil para continuar</p>
          </header>

          <ul className="sf-profiles-grid">
            {profiles.map((profile) => {
              const active = profile.id === activeProfileId;
              const hue = hueFromString(profile.id);
              const busy = selectingId === profile.id;

              return (
                <li key={profile.id}>
                  <button
                    className={`sf-profiles-card${active ? " sf-profiles-card--active" : ""}`}
                    disabled={selectingId !== null}
                    onClick={() => void handleSelectProfile(profile.id)}
                    type="button"
                  >
                    <span
                      className="sf-profiles-avatar-box"
                      data-busy={busy ? "true" : undefined}
                      style={{
                        background: `linear-gradient(145deg, hsl(${hue}, 52%, 38%), hsl(${(hue + 38) % 360}, 46%, 22%))`
                      }}
                    >
                      <span className="sf-profiles-avatar-initial" aria-hidden="true">
                        {(profile.displayName.slice(0, 1) || "?").toUpperCase()}
                      </span>
                    </span>
                    <span className="sf-profiles-card-name">{profile.displayName}</span>
                  </button>
                </li>
              );
            })}

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
            <button
              className="sf-profiles-admin-btn"
              disabled
              title="Próximamente en Family V1"
              type="button"
            >
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

"use client";

import Link from "next/link";
import { useProfileSession } from "./profile-context";

export function ProfileBadge() {
  const { activeProfileId, profiles, loading, errorMessage } =
    useProfileSession();

  if (errorMessage !== null) {
    return (
      <Link
        aria-label={`Perfiles: error al cargar. ${errorMessage}`}
        className="sf-nav-chip sf-nav-chip-warn"
        href="/profiles"
        title={errorMessage}
      >
        Perfiles
      </Link>
    );
  }

  if (loading) {
    return <span className="sf-nav-chip sf-nav-chip-muted">Perfiles…</span>;
  }

  const active = profiles.find((profile) => profile.id === activeProfileId);

  return (
    <Link className="sf-nav-chip" href="/profiles">
      {active?.displayName ?? "Elegir perfil"}
    </Link>
  );
}

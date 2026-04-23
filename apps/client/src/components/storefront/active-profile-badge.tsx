"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useProfileSession } from "./profile-context";

export function ActiveProfileBadge() {
  const router = useRouter();
  const { activeProfileId, profiles, loading, errorMessage } = useProfileSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return undefined;
    }

    function onPointerDown(event: PointerEvent) {
      const node = wrapRef.current;
      if (node !== null && !node.contains(event.target as Node)) {
        closeMenu();
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeMenu();
      }
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, closeMenu]);

  async function logout() {
    setLogoutPending(true);
    try {
      await fetch("/api/family/auth/logout", { credentials: "include", method: "POST" });
    } finally {
      setLogoutPending(false);
    }
    closeMenu();
    router.push("/auth/login");
    router.refresh();
  }

  if (loading) {
    return <span className="sf-nav-chip sf-nav-chip-muted">Perfil...</span>;
  }

  if (errorMessage !== null) {
    return (
      <Link className="sf-nav-chip sf-nav-chip-warn" href="/profiles" title={errorMessage}>
        Perfiles
      </Link>
    );
  }

  const active = profiles.find((profile) => profile.id === activeProfileId);
  const label = active?.displayName ?? "Elegir perfil";
  const initial = (label.slice(0, 1) || "P").toUpperCase();

  return (
    <div className="sf-nav-profile-wrap" ref={wrapRef}>
      <button
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="sf-nav-chip sf-nav-chip-profile sf-nav-profile-trigger"
        id="sf-nav-profile-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span aria-hidden="true" className="sf-nav-chip-avatar">
          {initial}
        </span>
        <span className="sf-nav-chip-label">{label}</span>
        <span aria-hidden="true" className="sf-nav-chip-chevron">
          ▾
        </span>
      </button>

      {menuOpen ? (
        <div
          aria-labelledby="sf-nav-profile-trigger"
          className="sf-nav-profile-dropdown"
          id="sf-nav-profile-menu"
          role="menu"
        >
          <Link
            className="sf-nav-profile-dropdown-item"
            href="/profiles"
            onClick={closeMenu}
            role="menuitem"
          >
            Cambiar perfil
          </Link>
          <button
            className="sf-nav-profile-dropdown-item sf-nav-profile-dropdown-item--danger"
            disabled={logoutPending}
            onClick={() => void logout()}
            role="menuitem"
            type="button"
          >
            {logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ADMIN_LOGIN_PATH = "/auth/admin/login";

export function AdminUserMenu({
  userEmail,
  userInitials
}: Readonly<{ userEmail: string; userInitials: string }>) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);

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
    router.push(ADMIN_LOGIN_PATH);
    router.refresh();
  }

  const displayEmail = userEmail.trim() === "" ? "—" : userEmail;

  return (
    <div className="hf-admin-user-menu" ref={wrapRef}>
      <button
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="hf-admin-user-menu-trigger"
        id="hf-admin-user-menu-trigger"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <span className="hf-admin-user-avatar" aria-hidden="true">
          {userInitials}
        </span>
        <span className="hf-admin-user-menu-trigger-label">{displayEmail}</span>
        <span aria-hidden="true" className="hf-admin-user-menu-chevron">
          ▾
        </span>
      </button>

      {menuOpen ? (
        <div
          aria-labelledby="hf-admin-user-menu-trigger"
          className="hf-admin-user-menu-dropdown"
          id="hf-admin-user-menu-panel"
          role="menu"
        >
          <div className="hf-admin-user-menu-section" role="none">
            <p className="hf-admin-user-menu-kicker">Sesión del backoffice</p>
            <p className="hf-admin-user-menu-email" title={displayEmail}>
              {displayEmail}
            </p>
            <p className="hf-admin-user-menu-hint">
              Esta entrada es para administrar el catálogo. Ver contenido como familia es otro flujo: desde la home,
              &quot;Iniciar sesión&quot; para el catálogo familiar.
            </p>
          </div>

          <div className="hf-admin-user-menu-divider" role="separator" />

          <Link
            className="hf-admin-user-menu-item"
            href="/auth/login"
            onClick={closeMenu}
            role="menuitem"
          >
            Ir a iniciar sesión en la home (contenido)
          </Link>
          <Link className="hf-admin-user-menu-item" href="/" onClick={closeMenu} role="menuitem">
            Ir al storefront
          </Link>

          <div className="hf-admin-user-menu-divider" role="separator" />

          <button
            className="hf-admin-user-menu-item hf-admin-user-menu-item--danger"
            disabled={logoutPending}
            onClick={() => void logout()}
            role="menuitem"
            type="button"
          >
            {logoutPending ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
          <p className="hf-admin-user-menu-footnote">
            La misma cuenta puede usar ambos accesos; al cerrar sesión aquí se cierra la sesión global de HomeFlix
            Family.
          </p>
        </div>
      ) : null}
    </div>
  );
}

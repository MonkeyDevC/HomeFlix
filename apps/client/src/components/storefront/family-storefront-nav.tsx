"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ActiveProfileBadge } from "./active-profile-badge";

type NavEntry = Readonly<{ href: string; label: string }>;

const NAV_ENTRIES: readonly NavEntry[] = [
  { href: "/", label: "Inicio" },
  { href: "/search", label: "Buscar" },
  { href: "/profiles", label: "Perfiles" }
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" className="sf-nav-icon-svg" fill="none" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg aria-hidden="true" className="sf-nav-icon-svg" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function FamilyStorefrontNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navegación principal" className="sf-nav sf-nav-premium">
      <ul className="sf-nav-links">
        {NAV_ENTRIES.map((entry) => (
          <li key={entry.href}>
            <Link
              aria-current={isActive(pathname, entry.href) ? "page" : undefined}
              className="sf-nav-link"
              href={entry.href}
            >
              {entry.label}
            </Link>
          </li>
        ))}
        <li>
          <span className="sf-nav-link-faux" title="Próximamente en Family V1">
            Mi lista
          </span>
        </li>
      </ul>

      <div className="sf-nav-cluster">
        <div className="sf-nav-tools">
          <Link aria-label="Buscar" className="sf-nav-icon-btn" href="/search" prefetch={false}>
            <SearchIcon />
          </Link>
          <button
            aria-label="Avisos (no disponible aún)"
            className="sf-nav-icon-btn"
            disabled
            title="Próximamente"
            type="button"
          >
            <BellIcon />
          </button>
        </div>
        <ActiveProfileBadge />
      </div>
    </nav>
  );
}

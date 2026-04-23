"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Readonly<Record<string, string>> = {
  "api-diagnostics": "API Diagnostics",
  architecture: "Arquitectura",
  "catalog-qa": "Catalog QA",
  dev: "Dev Console",
  "direct-upload": "Direct Upload",
  docs: "Docs",
  infrastructure: "Infraestructura",
  profiles: "Perfiles",
  "watch-history": "Watch History"
};

function breadcrumbFromPath(pathname: string): readonly { readonly href: string; readonly label: string }[] {
  const parts = pathname.split("/").filter(Boolean);
  const crumbs: { href: string; label: string }[] = [
    { href: "/dev", label: "Dev Console" }
  ];

  if (parts.length <= 1) {
    crumbs.push({ href: "/dev", label: "Dashboard" });
    return crumbs;
  }

  const rest = parts.slice(1);
  let acc = "/dev";

  for (const segment of rest) {
    acc = `${acc}/${segment}`;
    crumbs.push({
      href: acc,
      label: LABELS[segment] ?? segment
    });
  }

  return crumbs;
}

export function DevConsoleTopbar() {
  const pathname = usePathname();
  const crumbs = breadcrumbFromPath(pathname ?? "/dev");

  return (
    <header className="hdc-topbar">
      <nav aria-label="Migas de pan" className="hdc-breadcrumb">
        {crumbs.map((c, i) => (
          <span
            key={`hdc-crumb-${i}-${c.label}`}
            style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
          >
            {i > 0 ? <span className="hdc-breadcrumb-sep">/</span> : null}
            {i < crumbs.length - 1 ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span style={{ color: "var(--hdc-text, #e8eaef)" }}>{c.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="hdc-topbar-search">
        <input
          aria-label="Búsqueda en consola (no operativa)"
          disabled
          placeholder="Buscar en consola…"
          type="search"
        />
      </div>

      <div className="hdc-topbar-actions">
        <span className="hdc-btn-ghost" title="Perfil de sesión actual">
          Sesión admin
        </span>
        <Link className="hdc-btn-primary" href="/">
          Ir al storefront
        </Link>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconDashboard,
  IconFilm,
  IconGrid,
  IconHome,
  IconSeries,
  IconUsers
} from "./admin-nav-icons";

type Item = Readonly<{
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
}>;

const primary: readonly Item[] = [
  { href: "/admin", label: "Resumen", icon: <IconDashboard />, exact: true },
  { href: "/admin/categories", label: "Categorías", icon: <IconGrid /> },
  { href: "/admin/collections", label: "Series", icon: <IconSeries /> },
  { href: "/admin/content", label: "Contenido", icon: <IconFilm /> }
];

const access: readonly Item[] = [
  { href: "/admin/users", label: "Usuarios", icon: <IconUsers /> }
];

const secondary: readonly Item[] = [
  { href: "/", label: "Ir al storefront", icon: <IconHome /> }
];

export function AdminNav() {
  const pathname = usePathname() ?? "";

  return (
    <aside className="hf-admin-sidebar" aria-label="Navegación admin">
      <div className="hf-admin-brand">
        <div className="hf-admin-brand-logo">HF</div>
        <div className="hf-admin-brand-text">
          <span className="hf-admin-brand-title">HomeFlix</span>
          <span className="hf-admin-brand-subtitle">Admin · Family V1</span>
        </div>
      </div>

      <div className="hf-admin-sidebar-section">
        <p className="hf-admin-sidebar-label">Catálogo</p>
        {primary.map((item) => {
          const active = item.exact === true
            ? pathname === item.href || pathname === `${item.href}/`
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hf-admin-sidebar-link${active ? " is-active" : ""}`}
            >
              <span className="hf-admin-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="hf-admin-sidebar-section">
        <p className="hf-admin-sidebar-label">Acceso</p>
        {access.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hf-admin-sidebar-link${active ? " is-active" : ""}`}
            >
              <span className="hf-admin-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="hf-admin-sidebar-section">
        <p className="hf-admin-sidebar-label">Producto</p>
        {secondary.map((item) => (
          <Link key={item.href} href={item.href} className="hf-admin-sidebar-link">
            <span className="hf-admin-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="hf-admin-sidebar-footer">
        Panel interno · monolito Next.js. Las rutas <code>/api/family/admin/*</code> validan rol admin por sesión.
      </div>
    </aside>
  );
}

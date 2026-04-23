"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  IconActivity,
  IconBook,
  IconFilm,
  IconGauge,
  IconServer,
  IconUsers
} from "./dev-console-nav-icons";

type NavItem = Readonly<{
  href: string;
  label: string;
  icon: ReactNode;
}>;

type NavSection = Readonly<{
  title: string;
  items: readonly NavItem[];
}>;

const NAV: readonly NavSection[] = [
  {
    items: [
      { href: "/dev", icon: <IconGauge />, label: "Dashboard" },
      { href: "/dev/api-diagnostics", icon: <IconActivity />, label: "API Diagnostics" }
    ],
    title: "Overview"
  },
  {
    items: [{ href: "/dev/infrastructure", icon: <IconServer />, label: "Infraestructura" }],
    title: "Infrastructure"
  },
  {
    items: [
      { href: "/dev/catalog-qa", icon: <IconFilm />, label: "Catalog QA" },
      { href: "/dev/direct-upload", icon: <IconFilm />, label: "Direct Upload" }
    ],
    title: "Media Pipeline"
  },
  {
    items: [
      { href: "/dev/profiles", icon: <IconUsers />, label: "Perfiles" },
      { href: "/dev/watch-history", icon: <IconUsers />, label: "Watch History" }
    ],
    title: "Content & Profiles"
  },
  {
    items: [
      { href: "/dev/docs", icon: <IconBook />, label: "Docs" },
      { href: "/dev/architecture", icon: <IconBook />, label: "Arquitectura" }
    ],
    title: "Resources"
  }
];

export function DevConsoleSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hdc-sidebar" aria-label="Navegación de la consola">
      <div className="hdc-sidebar-brand">
        <p className="hdc-sidebar-brand-title">HomeFlix</p>
        <p className="hdc-sidebar-brand-sub">Dev Console</p>
      </div>

      {NAV.map((section) => (
        <div className="hdc-nav-section" key={section.title}>
          <p className="hdc-nav-section-label">{section.title}</p>
          {section.items.map((item) => {
            const active =
              item.href === "/dev"
                ? pathname === "/dev"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className="hdc-nav-item"
                href={item.href}
                key={item.href}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <div className="hdc-sidebar-footer">
        Entorno técnico interno. No expongas esta consola en producción pública sin
        controles adicionales.
      </div>
    </aside>
  );
}

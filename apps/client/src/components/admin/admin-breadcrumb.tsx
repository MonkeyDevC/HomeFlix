"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Segment = Readonly<{
  href: string;
  label: string;
}>;

const LABELS: Record<string, string> = {
  admin: "Resumen",
  categories: "Categorías",
  collections: "Series",
  content: "Contenido",
  new: "Nuevo",
  users: "Usuarios"
};

function labelFor(segment: string): string {
  const direct = LABELS[segment];
  if (direct !== undefined) return direct;
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Detalle";
  return segment.replace(/-/g, " ");
}

export function AdminBreadcrumb() {
  const pathname = usePathname() ?? "/admin";
  const parts = pathname.split("/").filter((s) => s.length > 0);

  const segments: Segment[] = [];
  let href = "";
  for (const part of parts) {
    href = `${href}/${part}`;
    segments.push({ href, label: labelFor(part) });
  }

  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="hf-admin-breadcrumb">
      <ol className="hf-admin-breadcrumb-list">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={segment.href} className="hf-admin-breadcrumb-item">
              {isLast ? (
                <span className="hf-admin-breadcrumb-current" aria-current="page">
                  {segment.label}
                </span>
              ) : (
                <>
                  <Link className="hf-admin-breadcrumb-link" href={segment.href}>
                    {segment.label}
                  </Link>
                  <span aria-hidden="true" className="hf-admin-breadcrumb-sep">
                    /
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import Link from "next/link";
import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";

const LINKS: readonly { readonly href: string; readonly label: readonly string[] }[] = [
  { href: "/dev", label: ["Overview", "Dashboard"] },
  { href: "/dev/api-diagnostics", label: ["API", "Status & dependencias"] },
  { href: "/dev/infrastructure", label: ["Infraestructura", "Postgres / Directus / Mux"] },
  { href: "/dev/catalog-qa", label: ["Catalog QA"] },
  { href: "/dev/direct-upload", label: ["Direct Upload"] },
  { href: "/dev/watch-history", label: ["Watch History"] },
  { href: "/dev/architecture", label: ["Arquitectura"] }
];

export const dynamic = "force-dynamic";

export default function DevDocsPage() {
  return (
    <>
      <DevConsolePageHeader
        description="Índice de rutas internas de la consola. La documentación de producto vive en el repositorio (README, docs/)."
        title="Docs"
      />
      <div className="hdc-panel">
        <h2 className="hdc-panel-title">Rutas de esta consola</h2>
        <ul className="hdc-actions-list">
          {LINKS.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                {item.label.join(" · ")} → {item.href}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <p className="hdc-muted" style={{ marginTop: 16 }}>
        Para variables de entorno y arranque local, abre el README del proyecto en tu editor o en el
        remoto del repositorio.
      </p>
    </>
  );
}

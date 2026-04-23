import Link from "next/link";
import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";

const layers = [
  {
    body: "Superficies de diagnóstico y consola; consume solo la API pública/documentada.",
    title: "Cliente (Next.js)"
  },
  {
    body: "Fastify, Prisma, contratos compartidos; fuente de verdad operativa para catálogo y reproducción.",
    title: "API"
  },
  {
    body: "Directus comparte Postgres con la API; este cliente no llama a Directus directamente.",
    title: "CMS"
  }
];

export const dynamic = "force-dynamic";

export default function DevArchitecturePage() {
  return (
    <>
      <DevConsolePageHeader
        description="Límites del monorepo y del modo consola frente al storefront público."
        title="Arquitectura"
      />
      <div className="hdc-grid" style={{ gap: 16 }}>
        {layers.map((layer) => (
          <article className="hdc-panel" key={layer.title}>
            <h2 className="hdc-panel-title">{layer.title}</h2>
            <p className="hdc-muted">{layer.body}</p>
          </article>
        ))}
      </div>
      <div className="hdc-panel" style={{ marginTop: 20 }}>
        <h2 className="hdc-panel-title">Documentación en repo</h2>
        <p className="hdc-muted">
          Consulta <code>README.md</code> en la raíz del monorepo y las carpetas <code>docs/</code>{" "}
          para fases, seguridad y operación.
        </p>
        <p className="hdc-muted" style={{ marginTop: 12, marginBottom: 0 }}>
          <Link href="/">Volver al storefront</Link>
        </p>
      </div>
    </>
  );
}

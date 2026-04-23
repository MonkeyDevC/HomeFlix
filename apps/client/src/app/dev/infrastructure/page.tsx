import { DevConsoleDepCard } from "../../../components/dev-console/dev-console-dep-card";
import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";
import { ErrorStateEnterprise } from "../../../components/dev-console/dev-console-states";
import { loadDevOverviewContext } from "../../../lib/dev-console/load-overview-context";

export const dynamic = "force-dynamic";

export default async function DevInfrastructurePage() {
  const ctx = await loadDevOverviewContext();

  if (ctx.kind === "blocked") {
    return (
      <>
        <DevConsolePageHeader
          description="Sin URL de API no hay telemetría de dependencias."
          title="Infraestructura"
        />
        <ErrorStateEnterprise message={ctx.message} title="Bloqueado" />
      </>
    );
  }

  if (ctx.kind === "api_error") {
    return (
      <>
        <DevConsolePageHeader
          description="No se pudo leer el status de la API para mapear dependencias."
          title="Infraestructura"
        />
        <ErrorStateEnterprise message={ctx.message} title="API no disponible" />
      </>
    );
  }

  const { payload } = ctx;
  const pg = payload.dependencies.find((d) => d.name === "postgres");
  const cms = payload.dependencies.find((d) => d.name === "directus");
  const mux = payload.dependencies.find((d) => d.name === "media-provider");

  return (
    <>
      <DevConsolePageHeader
        description="Vista ampliada de Postgres, Directus y proveedor de media según el último status de la API. Los contenedores locales se gestionan fuera de este cliente."
        title="Infraestructura"
      />
      <div className="hdc-grid hdc-grid-3" style={{ marginBottom: 20 }}>
        <DevConsoleDepCard dep={pg} title="Postgres" />
        <DevConsoleDepCard dep={cms} title="Directus" />
        <DevConsoleDepCard dep={mux} title="Media provider (Mux)" />
      </div>
      <div className="hdc-panel">
        <h2 className="hdc-panel-title">Notas operativas</h2>
        <p className="hdc-muted">
          Levanta Postgres y Directus con Docker según el README del monorepo. Las credenciales Mux y
          la base de datos deben coincidir con las variables de entorno de la API.
        </p>
      </div>
    </>
  );
}

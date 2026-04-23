import { CatalogProbeSurface } from "../../../components/catalog-probe-surface";
import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";
import { ErrorStateEnterprise } from "../../../components/dev-console/dev-console-states";
import { getClientRuntimeConfig } from "../../../config/client-env";

export const dynamic = "force-dynamic";

export default function DevCatalogQaPage() {
  const cfg = getClientRuntimeConfig();

  if (!cfg.ok) {
    return (
      <>
        <DevConsolePageHeader
          description="Catálogo y perfiles vía API autenticada."
          title="Catalog QA"
        />
        <ErrorStateEnterprise message={cfg.message} title="Configuración" />
      </>
    );
  }

  return (
    <>
      <DevConsolePageHeader
        description="Listado de ítems, perfiles y detalle mínimo para validar contratos de catálogo."
        title="Catalog QA"
      />
      <CatalogProbeSurface apiBaseUrl={cfg.config.apiBaseUrl} />
    </>
  );
}

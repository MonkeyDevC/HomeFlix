import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";
import { ErrorStateEnterprise } from "../../../components/dev-console/dev-console-states";
import { WatchHistoryProbeSurface } from "../../../components/watch-history-probe-surface";
import { getClientRuntimeConfig } from "../../../config/client-env";

export const dynamic = "force-dynamic";

export default function DevWatchHistoryPage() {
  const cfg = getClientRuntimeConfig();

  if (!cfg.ok) {
    return (
      <>
        <DevConsolePageHeader
          description="Pruebas de lectura y actualización de historial por perfil."
          title="Watch History"
        />
        <ErrorStateEnterprise message={cfg.message} title="Configuración" />
      </>
    );
  }

  return (
    <>
      <DevConsolePageHeader
        description="Superficie técnica existente: demostración de upsert y listados."
        title="Watch History"
      />
      <WatchHistoryProbeSurface apiBaseUrl={cfg.config.apiBaseUrl} />
    </>
  );
}

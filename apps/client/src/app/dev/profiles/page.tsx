import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";
import { ProfilesDevSurface } from "../../../components/dev-console/profiles-dev-surface";
import { ErrorStateEnterprise } from "../../../components/dev-console/dev-console-states";
import { getClientRuntimeConfig } from "../../../config/client-env";

export const dynamic = "force-dynamic";

export default function DevProfilesPage() {
  const cfg = getClientRuntimeConfig();

  if (!cfg.ok) {
    return (
      <>
        <DevConsolePageHeader description="Lista de perfiles vía GET /api/v1/profiles." title="Perfiles" />
        <ErrorStateEnterprise message={cfg.message} title="Configuración" />
      </>
    );
  }

  return (
    <>
      <DevConsolePageHeader
        description="Requiere sesión admin válida (misma regla que el resto de la consola)."
        title="Perfiles"
      />
      <ProfilesDevSurface apiBaseUrl={cfg.config.apiBaseUrl} />
    </>
  );
}

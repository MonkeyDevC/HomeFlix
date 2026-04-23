import { ApiHealthSurface } from "../../../components/api-health-surface";
import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";

export const dynamic = "force-dynamic";

export default function DevApiDiagnosticsPage() {
  return (
    <>
      <DevConsolePageHeader
        description="Respuesta completa de /api/v1/status, dependencias declaradas y metadatos de fase."
        title="API Diagnostics"
      />
      <ApiHealthSurface />
    </>
  );
}

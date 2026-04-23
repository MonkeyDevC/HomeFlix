import { DevConsolePageHeader } from "../../../components/dev-console/dev-console-page-header";
import { ErrorStateEnterprise } from "../../../components/dev-console/dev-console-states";
import { MediaUploadSurface } from "../../../components/media-upload-surface";
import { getClientRuntimeConfig } from "../../../config/client-env";

export const dynamic = "force-dynamic";

export default function DevDirectUploadPage() {
  const cfg = getClientRuntimeConfig();

  if (!cfg.ok) {
    return (
      <>
        <DevConsolePageHeader
          description="Flujo técnico de creación de upload y seguimiento de MediaAsset."
          title="Direct Upload"
        />
        <ErrorStateEnterprise message={cfg.message} title="Configuración" />
      </>
    );
  }

  return (
    <>
      <DevConsolePageHeader
        description="Legado V2: el upload a Mux fue retirado del cliente (Family V1)."
        title="Direct Upload"
      />
      <MediaUploadSurface />
    </>
  );
}

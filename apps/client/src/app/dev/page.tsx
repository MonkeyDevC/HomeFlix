import { DevConsolePageHeader } from "../../components/dev-console/dev-console-page-header";

export default function DevIndexPage() {
  return (
    <>
      <DevConsolePageHeader
        description="Consola tecnica heredada. Family V1 vive en el storefront y en /admin."
        title="Dev Console"
      />
      <section className="hdc-panel">
        <p className="hdc-panel-title">Area heredada</p>
        <p className="hdc-muted">
          Esta seccion se conserva solo como soporte de diagnostico y para evitar rutas vacias en desarrollo.
        </p>
      </section>
    </>
  );
}

export function CatalogProbeSurface({
  apiBaseUrl
}: Readonly<{
  apiBaseUrl: string;
}>) {
  return (
    <section className="hdc-panel" aria-label="Catalog QA">
      <p className="hdc-panel-title">Catalog QA legado</p>
      <p className="hdc-muted">
        Esta superficie se mantiene solo para no romper el build del repositorio. Family V1 ya no depende de esta
        lectura HTTP interna.
      </p>
      <p className="hdc-muted">API configurada: {apiBaseUrl}</p>
    </section>
  );
}

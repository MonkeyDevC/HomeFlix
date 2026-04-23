export function WatchHistoryProbeSurface({
  apiBaseUrl
}: Readonly<{
  apiBaseUrl: string;
}>) {
  return (
    <section className="hdc-panel" aria-label="Watch History QA">
      <p className="hdc-panel-title">Watch History legado</p>
      <p className="hdc-muted">
        El flujo activo de Family V1 usa persistencia server-side del monolito. Esta pantalla tecnica queda como
        placeholder seguro para el area dev.
      </p>
      <p className="hdc-muted">API configurada: {apiBaseUrl}</p>
    </section>
  );
}

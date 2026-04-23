import { getClientRuntimeConfig } from "../config/client-env";
import { fetchApiStatus } from "../lib/api/api-http-client";

export async function ApiHealthSurface() {
  const runtimeConfig = getClientRuntimeConfig();

  if (!runtimeConfig.ok) {
    return (
      <section className="status-panel status-panel-error" aria-label="Estado de la API">
        <h2 className="dev-panel-title">Configuración de la API</h2>
        <p>{runtimeConfig.message}</p>
      </section>
    );
  }

  const apiStatus = await fetchApiStatus(runtimeConfig.config.apiBaseUrl);

  if (apiStatus.state !== "ok") {
    return (
      <section className="status-panel status-panel-error" aria-label="Estado de la API">
        <h2 className="dev-panel-title">API no disponible</h2>
        <p>{apiStatus.message}</p>
        <p className="status-meta">{apiStatus.endpoint}</p>
      </section>
    );
  }

  const payload = apiStatus.response.ok ? apiStatus.response.data : null;

  if (payload === null) {
    return (
      <section className="status-panel status-panel-error" aria-label="Estado de la API">
        <h2 className="dev-panel-title">Contrato de API incoherente</h2>
        <p>
          La API respondió, pero el cuerpo no coincide con la forma esperada de éxito.
        </p>
        <p className="status-meta">{apiStatus.endpoint}</p>
      </section>
    );
  }

  return (
    <section className="status-panel" aria-label="Estado de la API">
      <div>
        <h2 className="dev-panel-title">Estado de la API</h2>
        <p className="status-value">{payload.status}</p>
        <p className="status-meta">{apiStatus.endpoint}</p>
      </div>

      <dl className="status-grid">
        <div>
          <dt>Versión</dt>
          <dd>{payload.apiVersion}</dd>
        </div>
        <div>
          <dt>Fase</dt>
          <dd>{payload.phase}</dd>
        </div>
        <div>
          <dt>Entorno</dt>
          <dd>{payload.environment}</dd>
        </div>
      </dl>

      <div className="dependency-list">
        {payload.dependencies.map((dependency) => (
          <article className="dependency-item" key={dependency.name}>
            <h3>{dependency.name}</h3>
            <p className="dependency-state">{dependency.status}</p>
            <p>{dependency.note}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

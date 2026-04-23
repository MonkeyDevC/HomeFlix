import Link from "next/link";
import type { ServiceDependency, ServiceDependencyName, ServiceStatusPayload } from "@homeflix/contracts";
import {
  type DevExecutiveState,
  loadDevOverviewContext
} from "../../lib/dev-console/load-overview-context";
import { DevConsoleDepCard } from "./dev-console-dep-card";
import { DevConsolePageHeader } from "./dev-console-page-header";
import { EmptyStateEnterprise } from "./dev-console-states";
import {
  CriticalIssuesSection,
  type CriticalIssueItem,
  HeroOverviewBanner,
  type HeroTone
} from "./dev-overview-parts";

function findDep(
  deps: readonly ServiceDependency[],
  name: ServiceDependencyName
): ServiceDependency | undefined {
  return deps.find((d) => d.name === name);
}

function depLabel(name: ServiceDependencyName): string {
  switch (name) {
    case "postgres":
      return "Postgres";
    case "directus":
      return "Directus";
    case "media-provider":
      return "Proveedor de media (Mux)";
    default:
      return name;
  }
}

function buildIssuesFromReady(payload: ServiceStatusPayload): CriticalIssueItem[] {
  const out: CriticalIssueItem[] = [];

  if (payload.status === "degraded") {
    out.push({
      id: "api-marked-degraded",
      severity: "warning",
      title: "La API marca el servicio como degradado",
      description:
        "El estado global de la API es `degraded`: puede faltar verificación de integraciones o quedar catálogo/reproducción sin garantías hasta completar variables y dependencias."
    });
  }

  for (const dep of payload.dependencies) {
    if (dep.status === "missing_credentials") {
      out.push({
        id: `cred-${dep.name}`,
        severity: "critical",
        title: `${depLabel(dep.name)}: faltan credenciales`,
        description: dep.note
      });
    } else if (dep.status === "not_configured") {
      out.push({
        id: `nc-${dep.name}`,
        severity: "warning",
        title: `${depLabel(dep.name)}: sin configurar`,
        description: dep.note
      });
    } else if (dep.status === "deferred") {
      out.push({
        id: `def-${dep.name}`,
        severity: "warning",
        title: `${depLabel(dep.name)}: configuración diferida`,
        description: dep.note
      });
    }
  }

  return out;
}

function heroToneForExecutive(ex: DevExecutiveState): HeroTone {
  if (ex === "OK") {
    return "ok";
  }

  if (ex === "DEGRADED") {
    return "degraded";
  }

  return "error";
}

function heroBadgeForExecutive(ex: DevExecutiveState): string {
  if (ex === "OK") {
    return "OK";
  }

  if (ex === "DEGRADED") {
    return "DEGRADADO";
  }

  return "ERROR";
}

function headlineForReady(ex: DevExecutiveState): string {
  if (ex === "ERROR") {
    return "Bloqueo operativo: credenciales o dependencias críticas incompletas";
  }

  if (ex === "DEGRADED") {
    return "Operativo con riesgos: gaps de configuración en API o proveedores";
  }

  return "Estado estable según el último chequeo de la API";
}

export async function DevOverviewDashboard() {
  const ctx = await loadDevOverviewContext();

  if (ctx.kind === "blocked") {
    const issues: CriticalIssueItem[] = [
      {
        id: "blocked-api-url",
        severity: "critical",
        title: "La consola no puede resolver la URL de la API",
        description: ctx.message
      }
    ];

    return (
      <>
        <DevConsolePageHeader
          description="Sin telemetría de `/api/v1/status` no hay resumen ejecutivo de dependencias."
          title="Overview Dashboard"
        />
        <HeroOverviewBanner
          badgeText="BLOQUEADO"
          errors={1}
          headline="Configuración de cliente incompleta: falta base URL de API"
          impact={ctx.message}
          tone="blocked"
          warnings={0}
        />
        <CriticalIssuesSection issues={issues} />
      </>
    );
  }

  if (ctx.kind === "api_error") {
    const detail =
      ctx.endpoint !== undefined ? `${ctx.message} (endpoint: ${ctx.endpoint})` : ctx.message;
    const issues: CriticalIssueItem[] = [
      {
        id: "api-status-fetch",
        severity: "critical",
        title: "No se obtuvo un payload de status válido desde la API",
        description: detail
      }
    ];

    return (
      <>
        <DevConsolePageHeader
          description="El chequeo HTTP al status falló o devolvió un cuerpo no interpretable."
          title="Overview Dashboard"
        />
        <HeroOverviewBanner
          badgeText="ERROR"
          errors={1}
          headline="La API no respondió al chequeo de status de la consola"
          impact={detail}
          tone="error"
          warnings={0}
        />
        <CriticalIssuesSection issues={issues} />
      </>
    );
  }

  const { executive, errors, payload, summary, warnings } = ctx;
  const pg = findDep(payload.dependencies, "postgres");
  const cms = findDep(payload.dependencies, "directus");
  const mux = findDep(payload.dependencies, "media-provider");
  const issues = buildIssuesFromReady(payload);
  const tone = heroToneForExecutive(executive);
  const phaseLine = `Fase API: ${payload.phase} · Entorno: ${payload.environment} · ${payload.service} v${payload.apiVersion}`;

  return (
    <>
      <DevConsolePageHeader
        description="Vista ejecutiva del último `/api/v1/status`: bloqueos primero, luego salud por dependencia."
        title="Overview Dashboard"
      />

      <HeroOverviewBanner
        badgeText={heroBadgeForExecutive(executive)}
        errors={errors}
        headline={headlineForReady(executive)}
        impact={summary}
        phaseLine={phaseLine}
        tone={tone}
        warnings={warnings}
      />

      <CriticalIssuesSection
        emptyHint="Ninguna dependencia marcó credenciales faltantes, pendiente o diferido, y la API no reporta estado `degraded` en este payload."
        issues={issues}
      />

      <section aria-label="Salud de infraestructura" className="hdc-infra-overview-section">
        <header className="hdc-infra-overview-head">
          <h2 className="hdc-infra-overview-title">Infraestructura (último status)</h2>
          <p className="hdc-infra-overview-desc">
            Comparación por dependencia; prioriza la sección de incidencias si hay discrepancias o credenciales faltantes.
          </p>
        </header>
        <div className="hdc-grid hdc-grid-3">
          <DevConsoleDepCard dep={pg} title="Postgres" variant="overview" />
          <DevConsoleDepCard dep={cms} title="Directus" variant="overview" />
          <DevConsoleDepCard dep={mux} title="Media provider (Mux)" variant="overview" />
        </div>
      </section>

      <div className="hdc-grid hdc-grid-2-1" style={{ marginBottom: 28 }}>
        <section aria-label="Pipeline de media y catálogo">
          <div className="hdc-panel">
            <h2 className="hdc-panel-title">Media pipeline &amp; catálogo</h2>
            <div className="hdc-grid" style={{ gap: 16 }}>
              <div className="hdc-card">
                <h3 className="hdc-card-title">Resumen de catálogo</h3>
                <p className="hdc-card-body">
                  Conteos y lecturas de QA requieren sesión en el cliente. Usa{" "}
                  <Link href="/dev/catalog-qa">Catalog QA</Link> autenticado para validar lecturas reales.
                </p>
                <p className="hdc-muted" style={{ marginTop: 10, marginBottom: 0 }}>
                  API v{payload.apiVersion} · servicio {payload.service}
                </p>
              </div>
              <EmptyStateEnterprise
                action={
                  <Link className="hdc-btn-primary" href="/dev/direct-upload">
                    Abrir Direct Upload
                  </Link>
                }
                description="No hay feed en vivo de subidas en esta vista. Tras un upload, revisa el módulo Direct Upload y el diagnóstico API para trazas."
                title="Recent uploads feed"
              />
              <div className="hdc-card">
                <h3 className="hdc-card-title">Media provider (HLS / DASH)</h3>
                <p className="hdc-card-body">{mux?.note ?? "Sin nota de proveedor en el último status."}</p>
                <p className="hdc-muted" style={{ marginTop: 8, marginBottom: 0 }}>
                  Estado declarado: <strong>{mux?.status ?? "—"}</strong>
                </p>
              </div>
            </div>
          </div>
        </section>

        <aside aria-label="Herramientas y contexto">
          <div className="hdc-panel" style={{ marginBottom: 16 }}>
            <h2 className="hdc-panel-title">Acciones rápidas</h2>
            <ul className="hdc-actions-list">
              <li>
                <Link href="/dev/catalog-qa">Abrir Catalog QA</Link>
              </li>
              <li>
                <Link href="/dev/direct-upload">Abrir Direct Upload</Link>
              </li>
              <li>
                <Link href="/dev/watch-history">Abrir Watch History</Link>
              </li>
              <li>
                <Link href="/dev/api-diagnostics">Ver diagnóstico API completo</Link>
              </li>
            </ul>
          </div>
          <div className="hdc-panel" style={{ marginBottom: 16 }}>
            <h2 className="hdc-panel-title">Perfiles (vistazo)</h2>
            <p className="hdc-muted">
              La lista de perfiles requiere sesión autenticada en el cliente. Abre{" "}
              <Link href="/dev/profiles">Perfiles</Link> tras iniciar sesión como admin.
            </p>
          </div>
          <div className="hdc-panel">
            <h2 className="hdc-panel-title">Notas de arquitectura</h2>
            <p className="hdc-muted">
              Capas cliente / API / CMS y límites del monorepo.{" "}
              <Link href="/dev/architecture">Ver sección Arquitectura</Link>.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

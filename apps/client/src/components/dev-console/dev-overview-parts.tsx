import Link from "next/link";
import type { ReactNode } from "react";
import { DevOverviewRetryButton } from "./dev-overview-retry-button";

export type HeroTone = "ok" | "degraded" | "error" | "blocked";

export function HeroOverviewBanner({
  tone,
  badgeText,
  headline,
  impact,
  phaseLine,
  warnings,
  errors
}: Readonly<{
  tone: HeroTone;
  badgeText: string;
  headline: string;
  impact: string;
  phaseLine?: string;
  warnings?: number;
  errors?: number;
}>) {
  const toneClass = `hdc-hero-status hdc-hero-status--${tone}`;

  return (
    <section aria-label="Estado del sistema" className={toneClass}>
      <div className="hdc-hero-status-grid">
        <div className="hdc-hero-status-icon" aria-hidden="true">
          <HeroGlyph tone={tone} />
        </div>
        <div className="hdc-hero-status-main">
          <div className="hdc-hero-status-top">
            <span className={`hdc-hero-badge hdc-hero-badge--${tone}`}>{badgeText}</span>
            <h2 className="hdc-hero-headline">{headline}</h2>
          </div>
          <p className="hdc-hero-impact">{impact}</p>
          {phaseLine !== undefined ? <p className="hdc-hero-meta">{phaseLine}</p> : null}
          {warnings !== undefined && errors !== undefined ? (
            <p className="hdc-hero-metrics">
              <span>
                <strong>{errors}</strong> críticas
              </span>
              <span className="hdc-hero-metrics-sep">·</span>
              <span>
                <strong>{warnings}</strong> advertencias
              </span>
            </p>
          ) : null}
          <div className="hdc-hero-actions">
            <Link className="hdc-btn-hero-secondary" href="/dev/infrastructure">
              Revisar configuración
            </Link>
            <Link className="hdc-btn-hero-secondary" href="/dev/api-diagnostics">
              Ver diagnóstico API
            </Link>
            <DevOverviewRetryButton />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroGlyph({ tone }: Readonly<{ tone: HeroTone }>) {
  if (tone === "ok") {
    return (
      <svg fill="none" height="56" viewBox="0 0 56 56" width="56">
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeOpacity="0.35" strokeWidth="2" />
        <path d="M18 29l7 7 14-16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    );
  }

  if (tone === "degraded") {
    return (
      <svg fill="none" height="56" viewBox="0 0 56 56" width="56">
        <circle cx="28" cy="28" r="26" stroke="currentColor" strokeOpacity="0.45" strokeWidth="2" />
        <path d="M28 16v20M28 38v4" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
      </svg>
    );
  }

  return (
    <svg fill="none" height="56" viewBox="0 0 56 56" width="56">
      <circle cx="28" cy="28" r="26" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" />
      <path d="M28 18v14M28 36v2" stroke="currentColor" strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}

export type CriticalIssueItem = Readonly<{
  id: string;
  severity: "critical" | "warning";
  title: string;
  description: string;
}>;

export function CriticalIssuesSection({
  issues,
  emptyHint
}: Readonly<{
  issues: readonly CriticalIssueItem[];
  emptyHint?: ReactNode;
}>) {
  return (
    <section aria-label="Incidencias prioritarias" className="hdc-critical-section">
      <div className="hdc-critical-section-head">
        <h2 className="hdc-critical-section-title">Incidencias prioritarias</h2>
        <p className="hdc-critical-section-desc">
          Bloquean o degradan catálogo, uploads firmados o reproducción según el último status de la API.
        </p>
      </div>

      {issues.length === 0 ? (
        <div className="hdc-critical-empty" role="status">
          <span className="hdc-badge hdc-badge-ok">Sin bloqueadores</span>
          <p className="hdc-critical-empty-text">
            {emptyHint ??
              "No se detectaron credenciales faltantes ni fallos de alcance en el último status."}
          </p>
        </div>
      ) : (
        <ul className="hdc-critical-list">
          {issues.map((issue) => (
            <li className={`hdc-critical-item hdc-critical-item--${issue.severity}`} key={issue.id}>
              <div className="hdc-critical-item-head">
                <h3 className="hdc-critical-item-title">{issue.title}</h3>
                <span
                  className={
                    issue.severity === "critical" ? "hdc-badge hdc-badge-err" : "hdc-badge hdc-badge-warn"
                  }
                >
                  {issue.severity === "critical" ? "Crítico" : "Advertencia"}
                </span>
              </div>
              <p className="hdc-critical-item-desc">{issue.description}</p>
              <div className="hdc-critical-item-actions">
                <Link className="hdc-link-action" href="/dev/infrastructure">
                  Corregir configuración
                </Link>
                <Link className="hdc-link-action" href="/dev/api-diagnostics">
                  Ver logs / diagnóstico
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

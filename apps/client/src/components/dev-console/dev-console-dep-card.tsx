import type { ServiceDependency } from "@homeflix/contracts";
import { dependencyVisualScore } from "../../lib/dev-console/load-overview-context";

function DepGlyph({ status }: Readonly<{ status: ServiceDependency["status"] }>) {
  if (status === "configured") {
    return (
      <span className="hdc-dep-icon hdc-dep-icon--ok" aria-hidden="true">
        <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path d="M4 9l3 3 7-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </span>
    );
  }

  if (status === "missing_credentials") {
    return (
      <span className="hdc-dep-icon hdc-dep-icon--err" aria-hidden="true">
        <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
          <path d="M9 4v6M9 12v2" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
      </span>
    );
  }

  return (
    <span className="hdc-dep-icon hdc-dep-icon--warn" aria-hidden="true">
      <svg fill="none" height="18" viewBox="0 0 18 18" width="18">
        <path d="M9 4v5M9 11v3" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    </span>
  );
}

export function DevConsoleDepCard({
  title,
  dep,
  variant = "panel"
}: Readonly<{
  title: string;
  dep: ServiceDependency | undefined;
  variant?: "panel" | "overview";
}>) {
  if (dep === undefined) {
    const shell = variant === "overview" ? "hdc-infra-card hdc-infra-card--neutral" : "hdc-card";
    return (
      <div className={shell}>
        <div className="hdc-card-header hdc-infra-card-head">
          <div className="hdc-infra-card-title-row">
            <DepGlyph status="not_configured" />
            <h3 className="hdc-card-title">{title}</h3>
          </div>
          <span className="hdc-badge hdc-badge-neutral">N/D</span>
        </div>
        <p className="hdc-card-body">Sin dato en el último status.</p>
      </div>
    );
  }

  const pct = dependencyVisualScore(dep);
  const badgeClass =
    dep.status === "configured"
      ? "hdc-badge hdc-badge-ok"
      : dep.status === "missing_credentials"
        ? "hdc-badge hdc-badge-err"
        : "hdc-badge hdc-badge-warn";

  const label =
    dep.status === "configured"
      ? "OK"
      : dep.status === "missing_credentials"
        ? "CRÍTICO"
        : dep.status === "not_configured"
          ? "PENDIENTE"
          : "DIFERIDO";

  const shellClass =
    variant === "overview"
      ? [
          "hdc-infra-card",
          dep.status === "configured" && "hdc-infra-card--ok",
          dep.status === "missing_credentials" && "hdc-infra-card--critical",
          dep.status !== "configured" &&
            dep.status !== "missing_credentials" &&
            "hdc-infra-card--warn"
        ]
          .filter(Boolean)
          .join(" ")
      : "hdc-card";

  return (
    <div className={shellClass}>
      <div className="hdc-card-header hdc-infra-card-head">
        <div className="hdc-infra-card-title-row">
          <DepGlyph status={dep.status} />
          <h3 className="hdc-card-title">{title}</h3>
        </div>
        <span className={badgeClass}>{label}</span>
      </div>
      <p className="hdc-card-body">{dep.note}</p>
      {dep.url !== undefined && dep.url.length > 0 ? (
        <p className="hdc-muted" style={{ marginTop: 8, marginBottom: 0, wordBreak: "break-all" }}>
          URL: {dep.url}
        </p>
      ) : null}
      <p className="hdc-muted" style={{ marginTop: 8, marginBottom: 0 }}>
        Estado: <code>{dep.status}</code>
      </p>
      <div className="hdc-mini-chart" title="Indicador relativo de configuración (no es métrica en vivo)">
        <div
          className="hdc-mini-chart-fill"
          style={{
            background:
              dep.status === "configured"
                ? "linear-gradient(90deg,#22c55e,#4ade80)"
                : dep.status === "missing_credentials"
                  ? "linear-gradient(90deg,#ef4444,#f87171)"
                  : "linear-gradient(90deg,#f59e0b,#fbbf24)",
            width: `${pct}%`
          }}
        />
      </div>
    </div>
  );
}

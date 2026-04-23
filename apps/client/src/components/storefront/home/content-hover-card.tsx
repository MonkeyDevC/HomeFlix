function excerpt(text: string | null | undefined, max = 132): string | null {
  if (text === null || text === undefined) {
    return null;
  }

  const clean = text.trim();
  if (clean.length === 0) {
    return null;
  }

  return clean.length <= max ? clean : `${clean.slice(0, max).trim()}...`;
}

export function ContentHoverCard({
  active,
  title,
  subtitle,
  synopsis,
  primaryActionLabel,
  secondaryActionLabel,
  progressPercent,
  progressLabel
}: Readonly<{
  active: boolean;
  title: string;
  subtitle?: string | null | undefined;
  synopsis?: string | null | undefined;
  primaryActionLabel?: string | undefined;
  secondaryActionLabel?: string | undefined;
  progressPercent?: number | null | undefined;
  progressLabel?: string | null | undefined;
}>) {
  const copy = excerpt(synopsis);
  const showProgress = progressPercent !== null && progressPercent !== undefined;
  const normalizedProgress = showProgress ? Math.max(0, Math.min(100, Math.round(progressPercent))) : 0;

  return (
    <div className={`sf-home-hover-card${active ? " is-visible" : ""}`} aria-hidden="true">
      <div className="sf-home-hover-actions">
        <span className="sf-home-hover-action sf-home-hover-action-primary">
          {primaryActionLabel ?? "Reproducir"}
        </span>
        <span className="sf-home-hover-action">{secondaryActionLabel ?? "Ver detalle"}</span>
      </div>

      <div className="sf-home-hover-copy">
        <p className="sf-home-hover-title">{title}</p>
        {subtitle ? <p className="sf-home-hover-subtitle">{subtitle}</p> : null}
        {copy ? <p className="sf-home-hover-synopsis">{copy}</p> : null}
      </div>

      {showProgress ? (
        <div className="sf-home-hover-progress">
          <div className="sf-home-hover-progress-track" role="presentation">
            <span
              className="sf-home-hover-progress-fill"
              style={{ width: `${normalizedProgress}%` }}
            />
          </div>
          {progressLabel ? <p className="sf-home-hover-progress-label">{progressLabel}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

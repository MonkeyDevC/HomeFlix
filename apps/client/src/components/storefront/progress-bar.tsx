export function ProgressBar({
  progressPercent
}: Readonly<{ progressPercent: number }>) {
  const pct = Math.max(0, Math.min(100, Math.round(progressPercent)));
  return (
    <div
      className="sf-cw-progress"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progreso de reproducción"
    >
      <span className="sf-cw-progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}


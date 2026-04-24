"use client";

export function ProgressBar({
  progress,
  id,
  className,
  variant = "default"
}: Readonly<{
  /** 0–100 */
  progress: number;
  id?: string;
  className?: string;
  /** Barra alta con gradiente y glow (upload de video en admin). */
  variant?: "default" | "neon";
}>) {
  const pct = Math.max(0, Math.min(100, progress));
  const trackClass = [
    "hf-admin-progress-bar",
    variant === "neon" ? "hf-admin-progress-bar--neon" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(pct)}
      className={trackClass}
      id={id}
      role="progressbar"
    >
      <div
        className={[
          "hf-admin-progress-bar__fill",
          variant === "neon" ? "hf-admin-progress-bar__fill--neon" : ""
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

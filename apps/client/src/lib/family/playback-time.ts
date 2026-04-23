function normalizePositiveSeconds(seconds: number | null | undefined): number | null {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  return seconds;
}

export function formatPlaybackClock(seconds: number | null | undefined): string | null {
  const value = normalizePositiveSeconds(seconds);
  if (value === null) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.round(value));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatRuntimeMinutes(seconds: number | null | undefined): string | null {
  const value = normalizePositiveSeconds(seconds);
  if (value === null) {
    return null;
  }

  if (value < 60) {
    return "<1 min";
  }

  return `${Math.ceil(value / 60)} min`;
}

export function formatContinueWatchingProgress(
  progressSeconds: number,
  durationSeconds: number | null | undefined
): string {
  const progressLabel = formatPlaybackClock(progressSeconds) ?? "0:00";
  const durationLabel = formatRuntimeMinutes(durationSeconds);

  return durationLabel === null ? progressLabel : `${progressLabel} / ${durationLabel}`;
}


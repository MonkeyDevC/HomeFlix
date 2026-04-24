const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

function formatUnitValue(n: number, unitIndex: number): string {
  if (unitIndex === 0) {
    return String(Math.round(n));
  }
  const rounded = Math.round(n * 10) / 10;
  if (Number.isInteger(rounded) || Math.abs(n - Math.round(n)) < 0.001) {
    return String(Math.round(n));
  }
  const s = rounded.toFixed(1);
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

/** Formato legible base 1024; hasta 1 decimal cuando aporta claridad (p. ej. 5,2 MB). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  let n = bytes;
  let u = 0;
  while (n >= 1024 && u < UNITS.length - 1) {
    n /= 1024;
    u += 1;
  }
  return `${formatUnitValue(n, u)} ${UNITS[u]}`;
}

/** Bytes restantes para completar la carga (no negativo). */
export function formatRemainingBytes(loadedBytes: number, totalBytes: number): string {
  const left = Math.max(0, totalBytes - loadedBytes);
  return formatBytes(left);
}

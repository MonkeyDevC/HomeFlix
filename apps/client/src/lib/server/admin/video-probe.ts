/**
 * Video quality probe (ffprobe).
 *
 * Inspecciona metadatos del stream de video subido (ancho, alto, fps, códec,
 * duración) para persistirlos junto al asset. NO re-encodea ni altera el
 * archivo: guardamos el binario tal cual para conservar la calidad original.
 *
 * Política editorial:
 *   - No imponemos un mínimo de resolución ni de frame rate en la carga. El
 *     admin puede subir cualquier calidad; lo importante es no degradarla en
 *     el proceso de almacenamiento.
 *   - Sí rechazamos archivos que no sean videos legibles (sin stream de
 *     video o con metadatos corruptos), porque de otro modo no podríamos
 *     reproducirlos.
 *
 * Usa el binario embebido de `ffprobe-static` para no depender de una
 * instalación manual por parte del administrador.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";

export type VideoProbeMetadata = Readonly<{
  width: number;
  height: number;
  frameRate: number;
  durationSeconds: number | null;
  codec: string | null;
}>;

export type VideoProbeResult =
  | Readonly<{ ok: true; metadata: VideoProbeMetadata }>
  | Readonly<{
      ok: false;
      code: "probe_failed" | "no_video_stream" | "invalid_metadata";
      message: string;
      metadata?: Partial<VideoProbeMetadata>;
    }>;

type FfprobeStream = Readonly<{
  codec_type?: string;
  codec_name?: string;
  width?: number;
  height?: number;
  r_frame_rate?: string;
  avg_frame_rate?: string;
  duration?: string;
}>;

type FfprobeFormat = Readonly<{
  duration?: string;
}>;

type FfprobeJson = Readonly<{
  streams?: readonly FfprobeStream[];
  format?: FfprobeFormat;
}>;

/**
 * Resuelve el binario de ffprobe en runtime.
 *
 * `ffprobe-static` expone `.path` calculado con `__dirname`; cuando Next.js
 * lo empaqueta, `__dirname` se reescribe a `\ROOT` y el binario queda
 * inalcanzable (ENOENT). Para evadirlo: 1) usamos `createRequire` que fuerza
 * resolución dinámica en Node (evade el análisis estático de Webpack), y
 * 2) si la ruta aún apunta a un archivo inexistente, reconstruimos la ruta
 * manualmente dentro del `node_modules` real del proceso.
 */
function resolveFfprobeBinary(): string {
  const require = createRequire(import.meta.url);

  let candidate: string | null = null;
  try {
    const mod = require("ffprobe-static") as { path?: string };
    if (typeof mod.path === "string" && mod.path !== "") {
      candidate = mod.path;
    }
  } catch {
    candidate = null;
  }

  if (candidate !== null && existsSync(candidate)) {
    return candidate;
  }

  const binName = process.platform === "win32" ? "ffprobe.exe" : "ffprobe";
  try {
    const pkgJson = require.resolve("ffprobe-static/package.json");
    const pkgDir = path.dirname(pkgJson);
    const manual = path.join(pkgDir, "bin", process.platform, process.arch, binName);
    if (existsSync(manual)) {
      return manual;
    }
  } catch {
    /* fall through */
  }

  const cwdGuess = path.join(
    process.cwd(),
    "node_modules",
    "ffprobe-static",
    "bin",
    process.platform,
    process.arch,
    binName
  );
  if (existsSync(cwdGuess)) {
    return cwdGuess;
  }

  throw new Error(
    `No se encontró el binario de ffprobe-static. Candidate original: ${candidate ?? "(none)"}`
  );
}

/**
 * Ejecuta ffprobe sobre un archivo local y devuelve el JSON crudo. Si el
 * proceso sale con código distinto de cero o devuelve un JSON inválido, lanza.
 */
async function runFfprobe(filePath: string): Promise<FfprobeJson> {
  const args = [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    filePath
  ];

  const binary = resolveFfprobeBinary();

  return await new Promise<FfprobeJson>((resolve, reject) => {
    const child = spawn(binary, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];

    child.stdout.on("data", (c: Buffer) => chunks.push(c));
    child.stderr.on("data", (c: Buffer) => errChunks.push(c));

    child.on("error", (err) => reject(err));

    child.on("close", (code) => {
      if (code !== 0) {
        const stderr = Buffer.concat(errChunks).toString("utf8").trim();
        reject(new Error(`ffprobe exited with code ${code}: ${stderr || "(no stderr)"}`));
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        const parsed = JSON.parse(raw) as unknown;
        if (parsed === null || typeof parsed !== "object") {
          reject(new Error("ffprobe returned non-object JSON"));
          return;
        }
        resolve(parsed as FfprobeJson);
      } catch (err) {
        reject(err instanceof Error ? err : new Error("ffprobe JSON parse failed"));
      }
    });
  });
}

/**
 * Evalúa una expresión "num/den" (p. ej. "60000/1001") y devuelve el decimal
 * más próximo. Devuelve NaN si no se puede parsear o la división es 0/0.
 */
function parseFrameRate(expr: string | undefined): number {
  if (expr === undefined || expr.trim() === "") return Number.NaN;
  const parts = expr.split("/");
  if (parts.length === 1) {
    const single = Number.parseFloat(parts[0] ?? "");
    return Number.isFinite(single) ? single : Number.NaN;
  }
  const num = Number.parseFloat(parts[0] ?? "");
  const den = Number.parseFloat(parts[1] ?? "");
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) {
    return Number.NaN;
  }
  return num / den;
}

/** Extrae metadatos útiles del primer stream de video encontrado. */
function extractVideoMetadata(
  data: FfprobeJson
): VideoProbeMetadata | { ok: false; code: "no_video_stream" | "invalid_metadata" } {
  const streams = data.streams ?? [];
  const videoStream = streams.find((s) => s.codec_type === "video");
  if (videoStream === undefined) {
    return { ok: false, code: "no_video_stream" };
  }

  const width = videoStream.width ?? 0;
  const height = videoStream.height ?? 0;
  if (width <= 0 || height <= 0) {
    return { ok: false, code: "invalid_metadata" };
  }

  const avg = parseFrameRate(videoStream.avg_frame_rate);
  const real = parseFrameRate(videoStream.r_frame_rate);
  const frameRate = Number.isFinite(avg) && avg > 0 ? avg : real;
  if (!Number.isFinite(frameRate) || frameRate <= 0) {
    return { ok: false, code: "invalid_metadata" };
  }

  const streamDuration = Number.parseFloat(videoStream.duration ?? "");
  const formatDuration = Number.parseFloat(data.format?.duration ?? "");
  const durationSeconds = Number.isFinite(streamDuration) && streamDuration > 0
    ? streamDuration
    : Number.isFinite(formatDuration) && formatDuration > 0
      ? formatDuration
      : null;

  return {
    width,
    height,
    frameRate: Math.round(frameRate * 1000) / 1000,
    durationSeconds,
    codec: videoStream.codec_name ?? null
  };
}

/**
 * Inspecciona un archivo de video en disco y devuelve sus metadatos.
 *
 * Solo falla si el archivo no contiene un stream de video reconocible o si
 * los metadatos básicos (ancho/alto/fps) no se pueden leer; de lo contrario,
 * devuelve la información tal cual venga — sin imponer un mínimo de calidad.
 */
export async function probeVideo(filePath: string): Promise<VideoProbeResult> {
  let raw: FfprobeJson;
  try {
    raw = await runFfprobe(filePath);
  } catch (err) {
    const message = err instanceof Error ? err.message : "probe_failed";
    return {
      ok: false,
      code: "probe_failed",
      message: `No se pudo inspeccionar el archivo de video (ffprobe): ${message}`
    };
  }

  const extracted = extractVideoMetadata(raw);
  if ("ok" in extracted && extracted.ok === false) {
    return {
      ok: false,
      code: extracted.code,
      message:
        extracted.code === "no_video_stream"
          ? "El archivo no contiene un stream de video reconocible."
          : "No se pudieron leer los metadatos del video (ancho/alto/fps)."
    };
  }

  return { ok: true, metadata: extracted as VideoProbeMetadata };
}

/** Etiqueta legible para la UI: "1080p · 60 fps · h264 · 12:34". */
export function formatVideoQualityLabel(meta: {
  width: number | null;
  height: number | null;
  frameRate: number | null;
  durationSeconds: number | null;
  codec?: string | null;
}): string {
  const parts: string[] = [];
  if (meta.height !== null && meta.height > 0) {
    parts.push(`${meta.height}p`);
  } else if (meta.width !== null && meta.width > 0) {
    parts.push(`${meta.width}w`);
  }
  if (meta.frameRate !== null && meta.frameRate > 0) {
    const display = Math.round(meta.frameRate * 100) / 100;
    parts.push(`${display} fps`);
  }
  if (meta.codec !== undefined && meta.codec !== null && meta.codec.trim() !== "") {
    parts.push(meta.codec);
  }
  if (meta.durationSeconds !== null && meta.durationSeconds > 0) {
    const totalMin = Math.floor(meta.durationSeconds / 60);
    const sec = Math.floor(meta.durationSeconds % 60);
    parts.push(`${totalMin}:${sec.toString().padStart(2, "0")}`);
  }
  return parts.join(" · ");
}

/**
 * Lista (no exhaustiva) de códecs de video que la mayoría de navegadores
 * actuales pueden reproducir nativamente en un contenedor `.mp4`.
 *
 * Excluimos a propósito:
 *   - HEVC/H.265: en Windows sólo funciona con GPU/decoder hardware.
 *   - AV1: Chrome/Edge lo soportan sólo con dav1d activo o hardware AV1
 *     (Intel 11th+, NVIDIA RTX 30+, AMD RX 6000+). Fuera de ese rango se
 *     manifiesta como "se escucha audio pero el video queda en negro".
 */
const BROWSER_FRIENDLY_CODECS = new Set(["h264", "avc1", "vp8", "vp9"]);

export function isBrowserFriendlyCodec(codec: string | null | undefined): boolean {
  if (codec === null || codec === undefined) return true;
  const key = codec.trim().toLowerCase();
  if (key === "") return true;
  return BROWSER_FRIENDLY_CODECS.has(key);
}

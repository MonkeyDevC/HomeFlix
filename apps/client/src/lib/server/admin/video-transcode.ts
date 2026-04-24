/**
 * Video transcode a H.264/AAC para reproducción universal.
 *
 * Motivación: subir archivos AV1/HEVC funciona en disco pero algunos
 * navegadores (Chrome/Edge sin GPU compatible) no los decodifican y muestran
 * pantalla negra con audio. Para que un video suba una vez y se reproduzca
 * en cualquier dispositivo familiar, re-encodeamos en el servidor a
 * H.264/AVC + AAC cuando el códec original no es browser-friendly.
 *
 * Política:
 *   - `crf 18` + `preset slow` → visualmente lossless, calidad equivalente
 *     a la fuente. No hay degradación perceptible.
 *   - `-c:a aac -b:a 192k` → audio compatible con todos los navegadores.
 *   - `-movflags +faststart` → reloca el moov atom al inicio para que el
 *     `<video>` pueda empezar a reproducir antes de descargar todo.
 *   - Conserva resolución y frame rate originales (no hay -s ni -r).
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { rename, stat, unlink } from "node:fs/promises";
import path from "node:path";

/**
 * Resuelve el binario de ffmpeg en runtime. Mismo patrón que
 * `video-probe.ts` para evadir el empaquetado estático de Next.js.
 */
function resolveFfmpegBinary(): string {
  const require = createRequire(import.meta.url);

  let candidate: string | null = null;
  try {
    const mod = require("ffmpeg-static") as string | { default?: string };
    const pathLike = typeof mod === "string" ? mod : (mod.default ?? null);
    if (typeof pathLike === "string" && pathLike !== "") {
      candidate = pathLike;
    }
  } catch {
    candidate = null;
  }

  if (candidate !== null && existsSync(candidate)) {
    return candidate;
  }

  const binName = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  try {
    const pkgJson = require.resolve("ffmpeg-static/package.json");
    const pkgDir = path.dirname(pkgJson);
    const manual = path.join(pkgDir, binName);
    if (existsSync(manual)) {
      return manual;
    }
  } catch {
    /* fall through */
  }

  const cwdGuess = path.join(process.cwd(), "node_modules", "ffmpeg-static", binName);
  if (existsSync(cwdGuess)) {
    return cwdGuess;
  }

  throw new Error(
    `No se encontró el binario de ffmpeg-static. Candidate original: ${candidate ?? "(none)"}`
  );
}

export type TranscodeProgress = (info: { seconds: number | null }) => void;

/**
 * Ejecuta ffmpeg y resuelve cuando el proceso termina correctamente.
 * Si `ffmpeg` sale con código distinto de cero, rechaza con el stderr.
 */
async function runFfmpeg(
  args: readonly string[],
  onProgress?: TranscodeProgress
): Promise<void> {
  const binary = resolveFfmpegBinary();

  return await new Promise<void>((resolve, reject) => {
    const child = spawn(binary, args, {
      windowsHide: true,
      stdio: ["ignore", "ignore", "pipe"]
    });

    const errChunks: Buffer[] = [];

    child.stderr.on("data", (chunk: Buffer) => {
      errChunks.push(chunk);
      if (onProgress !== undefined) {
        const text = chunk.toString("utf8");
        const match = /time=(\d+):(\d+):(\d+\.\d+)/.exec(text);
        if (match !== null) {
          const h = Number.parseFloat(match[1] ?? "0");
          const m = Number.parseFloat(match[2] ?? "0");
          const s = Number.parseFloat(match[3] ?? "0");
          const seconds = h * 3600 + m * 60 + s;
          onProgress({ seconds: Number.isFinite(seconds) ? seconds : null });
        }
      }
    });

    child.on("error", (err) => reject(err));

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const stderr = Buffer.concat(errChunks).toString("utf8").trim();
      const tail = stderr.slice(-400) || "(no stderr)";
      console.error("[homeflix:ffmpeg]", "exit_error", { code, stderrTail: tail });
      reject(new Error(`ffmpeg exited with code ${code}: ${tail}`));
    });
  });
}

/**
 * Transcodifica un archivo en disco a H.264/AAC (.mp4). Devuelve el mismo
 * path tras reemplazar el archivo original por la versión re-encodeada.
 *
 * Se apoya en un archivo temporal `<base>.transcoding.mp4` para garantizar
 * atomicidad: si ffmpeg falla, el original no se toca.
 */
export async function transcodeToH264InPlace(
  diskPath: string,
  onProgress?: TranscodeProgress
): Promise<void> {
  const dir = path.dirname(diskPath);
  const ext = path.extname(diskPath) || ".mp4";
  const base = path.basename(diskPath, ext);
  const tempOutput = path.join(dir, `${base}.transcoding${ext}`);

  if (existsSync(tempOutput)) {
    try {
      await unlink(tempOutput);
    } catch {
      /* ignorable */
    }
  }

  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-stats",
    "-i", diskPath,
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-movflags", "+faststart",
    tempOutput
  ];

  try {
    await runFfmpeg(args, onProgress);
  } catch (err) {
    try {
      await unlink(tempOutput);
    } catch {
      /* ignorable */
    }
    throw err;
  }

  await unlink(diskPath);
  await rename(tempOutput, diskPath);
}

/**
 * Convierte un `.mov` (QuickTime) a `.mp4` H.264/AAC en el mismo directorio.
 * El `.mov` de entrada se elimina; el resultado es siempre contenedor MP4
 * (no se sirven `.mov` al navegador).
 *
 * Si `diskPath` no termina en `.mov`, no hace nada y devuelve el mismo path.
 */
export async function convertMovToMp4OnDisk(
  diskPath: string,
  onProgress?: TranscodeProgress
): Promise<{ diskPath: string; replaced: boolean }> {
  const ext = path.extname(diskPath).toLowerCase();
  if (ext !== ".mov") {
    return { diskPath, replaced: false };
  }

  const dir = path.dirname(diskPath);
  const base = path.basename(diskPath, ext);
  const tempOutput = path.join(dir, `${base}.transcoding.mp4`);
  const finalOutput = path.join(dir, `${base}.mp4`);

  if (existsSync(tempOutput)) {
    try {
      await unlink(tempOutput);
    } catch {
      /* ignorable */
    }
  }
  if (existsSync(finalOutput)) {
    try {
      await unlink(finalOutput);
    } catch {
      /* ignorable */
    }
  }

  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-stats",
    "-i",
    diskPath,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "18",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    tempOutput
  ];

  console.info("[homeflix:ffmpeg]", "mov_to_mp4_start", { input: path.basename(diskPath) });

  try {
    await runFfmpeg(args, onProgress);
  } catch (err) {
    console.error("[homeflix:ffmpeg]", "mov_to_mp4_failed", {
      input: path.basename(diskPath),
      message: err instanceof Error ? err.message : String(err)
    });
    try {
      await unlink(tempOutput);
    } catch {
      /* ignorable */
    }
    throw err;
  }

  try {
    await unlink(diskPath);
  } catch (err) {
    console.error("[homeflix:ffmpeg]", "mov_to_mp4_remove_input_failed", {
      input: path.basename(diskPath),
      message: err instanceof Error ? err.message : String(err)
    });
    try {
      await unlink(tempOutput);
    } catch {
      /* ignorable */
    }
    throw err;
  }

  await rename(tempOutput, finalOutput);

  try {
    const st = await stat(finalOutput);
    if (st.size <= 0) {
      throw new Error("El archivo MP4 generado está vacío.");
    }
  } catch (err) {
    console.error("[homeflix:ffmpeg]", "mov_to_mp4_stat_failed", {
      output: path.basename(finalOutput),
      message: err instanceof Error ? err.message : String(err)
    });
    throw err;
  }

  console.info("[homeflix:ffmpeg]", "mov_to_mp4_done", { output: path.basename(finalOutput) });

  return { diskPath: finalOutput, replaced: true };
}

/**
 * Extrae un cuadro JPG del video para usarlo como thumbnail/poster automático
 * cuando el admin no subió una imagen manualmente. El frame se toma a ~10%
 * de la duración (con un piso mínimo de 1 segundo) para evitar el "frame
 * negro de fade-in" habitual al inicio.
 *
 * La imagen se escala a 1280 px de ancho como máximo manteniendo el aspect
 * ratio, lo suficiente para una portada HD sin inflar disco.
 */
export async function extractPosterFrame(
  srcVideoPath: string,
  destJpgPath: string,
  options: Readonly<{ durationSeconds: number | null; atSeconds?: number }> = {
    durationSeconds: null
  }
): Promise<void> {
  const dur = options.durationSeconds;
  const rawAt =
    options.atSeconds !== undefined
      ? options.atSeconds
      : dur !== null && dur > 0
        ? Math.max(1, Math.min(dur * 0.1, dur - 0.5))
        : 1;
  const atSeconds = Number.isFinite(rawAt) && rawAt > 0 ? rawAt : 1;

  const args = [
    "-y",
    "-hide_banner",
    "-loglevel", "error",
    "-ss", atSeconds.toFixed(2),
    "-i", srcVideoPath,
    "-frames:v", "1",
    "-vf", "scale='min(1280,iw)':-2",
    "-q:v", "3",
    destJpgPath
  ];

  await runFfmpeg(args);
}


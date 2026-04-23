"use client";

import { useMemo, useState, type SyntheticEvent } from "react";
import type { LocalPlaybackDto } from "../../lib/family/domain-shapes";
import { usePlaybackProgress } from "./use-playback-progress";

/**
 * Códecs que los navegadores modernos decodifican de forma confiable dentro
 * de un contenedor `.mp4`.
 *
 * - HEVC/H.265: Chrome/Firefox en Windows sólo lo decodifican con hardware
 *   específico — da el caso típico "se escucha pero se ve en negro".
 * - AV1: soportado nominalmente, pero depende de que el navegador tenga
 *   dav1d activo o GPU AV1 (Intel 11th+, RTX 30+, RX 6000+). Sin esas
 *   condiciones aparece exactamente el mismo síntoma de pantalla negra.
 *
 * La regla del proyecto: recomendamos H.264/AVC como baseline universal.
 */
const BROWSER_FRIENDLY_CODECS = new Set(["h264", "avc1", "vp8", "vp9"]);

function isBrowserFriendlyCodec(codec: string | null | undefined): boolean {
  if (codec === null || codec === undefined) return true;
  const key = codec.trim().toLowerCase();
  if (key === "") return true;
  return BROWSER_FRIENDLY_CODECS.has(key);
}

function describeMediaError(error: MediaError | null): string {
  if (error === null) {
    return "Error desconocido al reproducir el video.";
  }
  switch (error.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return "La reproducción fue cancelada.";
    case MediaError.MEDIA_ERR_NETWORK:
      return "Se perdió la conexión al servir el video.";
    case MediaError.MEDIA_ERR_DECODE:
      return "El navegador no pudo decodificar la pista de video (códec incompatible).";
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return "El formato/códec del archivo no es soportado por el navegador.";
    default:
      return error.message || "Error desconocido al reproducir el video.";
  }
}

export function LocalVideoPlayer({
  playback,
  posterPath,
  contentItemId,
  initialProgressSeconds
}: Readonly<{
  playback: LocalPlaybackDto;
  posterPath: string | null;
  contentItemId: string;
  initialProgressSeconds: number | null;
}>) {
  const { videoRef, onLoadedMetadata, onTimeUpdate, onPause, onEnded } = usePlaybackProgress({
    contentItemId,
    initialProgressSeconds
  });

  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const incompatibleCodecWarning = useMemo<string | null>(() => {
    if (isBrowserFriendlyCodec(playback.codec)) return null;
    return `Códec detectado: ${playback.codec}. Es posible que tu navegador no pueda decodificarlo (video en negro). Recomendado: H.264/AVC.`;
  }, [playback.codec]);

  function handleError(event: SyntheticEvent<HTMLVideoElement>) {
    const element = event.currentTarget;
    const detail = describeMediaError(element.error);
    const codecHint = playback.codec !== null ? ` Códec del archivo: ${playback.codec}.` : "";
    setPlaybackError(`${detail}${codecHint}`);
  }

  return (
    <section className="sf-playback" aria-label="Reproductor local">
      {incompatibleCodecWarning !== null ? (
        <p className="sf-playback-hint sf-playback-hint--warn" role="note">
          {incompatibleCodecWarning}
        </p>
      ) : null}

      <video
        controls
        onEnded={onEnded}
        onError={handleError}
        onLoadedMetadata={() => {
          setPlaybackError(null);
          onLoadedMetadata();
        }}
        onPause={onPause}
        onTimeUpdate={onTimeUpdate}
        poster={posterPath ?? undefined}
        preload="metadata"
        ref={videoRef}
        style={{ background: "#020617", borderRadius: "10px", maxHeight: "62vh", width: "100%" }}
      >
        <source src={playback.filePath} type={playback.mimeType ?? "video/mp4"} />
        Tu navegador no soporta reproducción HTML5 de video.
      </video>

      {playbackError !== null ? (
        <p className="sf-playback-hint sf-playback-hint--error" role="alert">
          {playbackError} Solución: pide al administrador que vuelva a subir el archivo desde el
          admin — el servidor lo convertirá automáticamente a H.264 compatible con cualquier
          navegador.
        </p>
      ) : null}
    </section>
  );
}

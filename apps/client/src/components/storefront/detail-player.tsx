"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { LocalPlaybackDto } from "../../lib/family/domain-shapes";
import { usePlaybackProgress } from "./use-playback-progress";

/**
 * Marcador de URL que indica "vengo de un avance automático de serie".
 * El DetailPlayer lo detecta al montar e intenta reproducir sin requerir
 * click manual. Se limpia de la URL inmediatamente tras leerlo.
 */
const AUTOPLAY_QUERY_PARAM = "autoplay";
const AUTOPLAY_QUERY_VALUE = "1";

/**
 * Marcador que indica "vengo de un avance automático con pantalla completa
 * activa". Sirve para volver a entrar en fullscreen del frame al montar el
 * siguiente episodio, preservando la experiencia inmersiva sin click extra.
 */
const FULLSCREEN_QUERY_PARAM = "fs";
const FULLSCREEN_QUERY_VALUE = "1";

type FullscreenCapableElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FullscreenCapableDocument = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(): Element | null {
  const doc = document as FullscreenCapableDocument;
  return (
    doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null
  );
}

async function requestFullscreen(el: HTMLElement): Promise<void> {
  const target = el as FullscreenCapableElement;
  if (typeof target.requestFullscreen === "function") {
    await target.requestFullscreen();
    return;
  }
  if (typeof target.webkitRequestFullscreen === "function") {
    await Promise.resolve(target.webkitRequestFullscreen());
    return;
  }
  if (typeof target.msRequestFullscreen === "function") {
    await Promise.resolve(target.msRequestFullscreen());
  }
}

async function exitFullscreen(): Promise<void> {
  const doc = document as FullscreenCapableDocument;
  if (typeof doc.exitFullscreen === "function") {
    await doc.exitFullscreen();
    return;
  }
  if (typeof doc.webkitExitFullscreen === "function") {
    await Promise.resolve(doc.webkitExitFullscreen());
    return;
  }
  if (typeof doc.msExitFullscreen === "function") {
    await Promise.resolve(doc.msExitFullscreen());
  }
}

export const DETAIL_PLAY_EVENT = "hf-detail-play";

export type NextEpisodeInfo = Readonly<{
  slug: string;
  title: string;
  thumbnailPath: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
}>;

const NEXT_EP_COUNTDOWN_SECONDS = 10;

/**
 * Overlay estilo Netflix: aparece cuando el episodio actual termina y
 * existe un siguiente episodio. Cuenta regresiva hasta auto-navegar; el
 * usuario puede cancelar o adelantarse con un click.
 */
function NextEpisodeOverlay({
  next,
  onCancel,
  onAdvance
}: Readonly<{
  next: NextEpisodeInfo;
  onCancel: () => void;
  onAdvance: () => void;
}>) {
  const [remaining, setRemaining] = useState<number>(NEXT_EP_COUNTDOWN_SECONDS);

  useEffect(() => {
    if (remaining <= 0) {
      onAdvance();
      return;
    }
    const t = window.setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => window.clearTimeout(t);
  }, [remaining, onAdvance]);

  const subtitle =
    next.seasonNumber !== null && next.episodeNumber !== null
      ? `T${next.seasonNumber} · E${next.episodeNumber}`
      : next.episodeNumber !== null
        ? `Episodio ${next.episodeNumber}`
        : "Siguiente episodio";

  return (
    <div className="sf-next-ep" role="dialog" aria-label="Siguiente episodio">
      {next.thumbnailPath !== null ? (
        <img
          alt=""
          aria-hidden="true"
          className="sf-next-ep-art"
          src={next.thumbnailPath}
        />
      ) : (
        <div aria-hidden="true" className="sf-next-ep-art sf-next-ep-art--placeholder" />
      )}
      <div className="sf-next-ep-scrim" aria-hidden="true" />
      <div className="sf-next-ep-body">
        <p className="sf-next-ep-eyebrow">{subtitle}</p>
        <h3 className="sf-next-ep-title">{next.title}</h3>
        <p className="sf-next-ep-hint">
          Siguiente episodio en <strong>{remaining}s</strong>
        </p>
        <div className="sf-next-ep-actions">
          <button
            className="sf-next-ep-btn sf-next-ep-btn--primary"
            onClick={onAdvance}
            type="button"
          >
            <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
              <path d="M8 5v14l11-7z" fill="currentColor" />
            </svg>
            <span>Reproducir ahora</span>
          </button>
          <button
            className="sf-next-ep-btn sf-next-ep-btn--ghost"
            onClick={onCancel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function DetailPlayer({
  playback,
  posterPath,
  contentItemId,
  initialProgressSeconds,
  title,
  nextEpisode
}: Readonly<{
  playback: LocalPlaybackDto;
  posterPath: string | null;
  contentItemId: string;
  initialProgressSeconds: number | null;
  title: string;
  nextEpisode?: NextEpisodeInfo | null;
}>) {
  const { videoRef, onLoadedMetadata, onTimeUpdate, onPause, onEnded } = usePlaybackProgress({
    contentItemId,
    initialProgressSeconds
  });
  const shellRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showNextOverlay, setShowNextOverlay] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const triggeredByTimeRef = useRef<boolean>(false);
  const autoplayHandledRef = useRef<boolean>(false);
  const fullscreenHandledRef = useRef<boolean>(false);

  const hasNext = nextEpisode !== null && nextEpisode !== undefined;

  /**
   * Prefetch del siguiente episodio para que la navegación SPA sea casi
   * instantánea y el `<html>` no pierda fullscreen durante una transición
   * larga.
   */
  useEffect(() => {
    if (!hasNext) return;
    try {
      router.prefetch(`/c/${encodeURIComponent(nextEpisode!.slug)}`);
    } catch {
      /* noop */
    }
  }, [router, hasNext, nextEpisode]);

  const handleEnded = useCallback(() => {
    onEnded();
    if (hasNext) {
      setShowNextOverlay(true);
    }
  }, [onEnded, hasNext]);

  /**
   * Respaldo: algunos navegadores no emiten `ended` de forma confiable
   * (buffer incompleto, decodificación tardía). Detectamos que estamos
   * a <= 0.35 s del final y forzamos el overlay una única vez por sesión
   * de reproducción. El flag `triggeredByTimeRef` se resetea cuando el
   * usuario reanuda el video (ver `handlePlay`).
   */
  const handleTimeUpdate = useCallback(() => {
    onTimeUpdate();
    if (!hasNext || triggeredByTimeRef.current) return;
    const el = videoRef.current;
    if (el === null) return;
    const duration = Number.isFinite(el.duration) ? el.duration : 0;
    if (duration <= 0) return;
    if (duration - el.currentTime <= 0.35) {
      triggeredByTimeRef.current = true;
      setShowNextOverlay(true);
    }
  }, [onTimeUpdate, hasNext, videoRef]);

  const cancelNext = useCallback(() => {
    setShowNextOverlay(false);
  }, []);

  const advanceNext = useCallback(() => {
    if (!hasNext) return;
    // Incluimos el flag `autoplay=1` para que el siguiente episodio se
    // reproduzca automáticamente tras el countdown. Si además estamos en
    // pantalla completa, pasamos `fs=1` para volver a entrar en fullscreen
    // del frame al montar el nuevo episodio (aprovechando la gesture previa
    // del usuario que disparó la reproducción del actual).
    const qs = new URLSearchParams();
    qs.set(AUTOPLAY_QUERY_PARAM, AUTOPLAY_QUERY_VALUE);
    if (getFullscreenElement() !== null) {
      qs.set(FULLSCREEN_QUERY_PARAM, FULLSCREEN_QUERY_VALUE);
    }
    router.push(`/c/${encodeURIComponent(nextEpisode!.slug)}?${qs.toString()}`);
  }, [router, hasNext, nextEpisode]);

  /**
   * Alterna pantalla completa sobre `document.documentElement` en lugar del
   * frame. Esto es crítico para que el fullscreen sobreviva a la navegación
   * SPA al siguiente episodio: el <html> nunca se desmonta, por lo que el
   * navegador no lo saca de fullscreen al cambiar de ruta, mientras que un
   * frame contenido en la page sí es reemplazado y perdería el modo.
   *
   * Para que en fullscreen solo se vea el player (y no la navbar/chrome),
   * el CSS usa `:fullscreen` sobre <html> para ocultar lo demás y expandir
   * el frame.
   */
  const toggleFullscreen = useCallback(() => {
    const target = document.documentElement;
    const current = getFullscreenElement();
    if (current === null) {
      // Marcamos una clase ANTES de solicitar fullscreen para que el CSS que
      // oculta la chrome ya esté aplicado en el primer frame y no haya flash.
      document.documentElement.classList.add("hf-player-fs-pending");
      void requestFullscreen(target).catch(() => {
        document.documentElement.classList.remove("hf-player-fs-pending");
      });
    } else {
      void exitFullscreen().catch(() => undefined);
    }
  }, []);

  /**
   * Sincroniza el flag `isFullscreen` con el estado real del documento.
   * Además intercepta los casos (ej. Firefox) donde el navegador entra en
   * fullscreen nativo del `<video>` ignorando `controlsList`: salimos de ese
   * fullscreen y pasamos el foco al <html> para mantener el overlay visible.
   */
  useEffect(() => {
    function handleChange() {
      const el = getFullscreenElement();
      const video = videoRef.current;
      if (el !== null && video !== null && el === video) {
        // Transferencia: salir del fullscreen del <video> y entrar en <html>.
        void exitFullscreen()
          .then(() => requestFullscreen(document.documentElement))
          .catch(() => undefined);
        return;
      }
      const active = el !== null;
      setIsFullscreen(active);
      if (active) {
        document.documentElement.classList.add("hf-player-fs");
      } else {
        document.documentElement.classList.remove("hf-player-fs");
        document.documentElement.classList.remove("hf-player-fs-pending");
      }
    }
    document.addEventListener("fullscreenchange", handleChange);
    document.addEventListener("webkitfullscreenchange", handleChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleChange);
      document.removeEventListener("webkitfullscreenchange", handleChange);
    };
  }, [videoRef]);

  /**
   * Wrapper de `onLoadedMetadata` que dispara reproducción automática si la
   * URL trae el flag `autoplay=1`. Luego limpia el flag de la URL para que
   * un refresh no vuelva a reproducirlo automáticamente.
   */
  const handleLoadedMetadata = useCallback(() => {
    onLoadedMetadata();

    if (autoplayHandledRef.current) return;
    const wantsAutoplay = searchParams?.get(AUTOPLAY_QUERY_PARAM) === AUTOPLAY_QUERY_VALUE;
    const wantsFullscreen =
      searchParams?.get(FULLSCREEN_QUERY_PARAM) === FULLSCREEN_QUERY_VALUE;
    if (!wantsAutoplay && !wantsFullscreen) return;
    autoplayHandledRef.current = true;

    const el = videoRef.current;
    if (wantsAutoplay && el !== null) {
      const p = el.play();
      if (p !== undefined) {
        p.catch(() => {
          // Políticas de autoplay: si el navegador bloquea (p.ej. sin
          // gesture reciente), reintentamos en muted para no dejar al
          // usuario con un video inmóvil. El muted lo puede quitar con
          // un click en el control nativo.
          try {
            el.muted = true;
            const retry = el.play();
            if (retry !== undefined) retry.catch(() => undefined);
          } catch {
            /* noop */
          }
        });
      }
    }

    // Si el episodio anterior estaba en pantalla completa, retomamos el
    // modo inmersivo. Apuntamos al <html> porque sobrevive a la navegación
    // SPA: normalmente el navegador ni siquiera habrá salido de fullscreen
    // y esta llamada es idempotente.
    if (wantsFullscreen && !fullscreenHandledRef.current) {
      fullscreenHandledRef.current = true;
      if (getFullscreenElement() === null) {
        document.documentElement.classList.add("hf-player-fs-pending");
        void requestFullscreen(document.documentElement).catch(() => {
          document.documentElement.classList.remove("hf-player-fs-pending");
        });
      }
    }

    // Limpia los query params para que un refresh manual no retenga flags.
    if (pathname !== null && pathname !== undefined) {
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      params.delete(AUTOPLAY_QUERY_PARAM);
      params.delete(FULLSCREEN_QUERY_PARAM);
      const qs = params.toString();
      const nextUrl = qs === "" ? pathname : `${pathname}?${qs}`;
      window.history.replaceState(null, "", nextUrl);
    }
  }, [onLoadedMetadata, searchParams, pathname, videoRef]);

  useEffect(() => {
    function handlePlayRequest() {
      const el = videoRef.current;
      if (el === null) {
        return;
      }
      shellRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      const playPromise = el.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Fallback: el usuario debe iniciar la reproducción manualmente (políticas de autoplay).
        });
      }
    }
    window.addEventListener(DETAIL_PLAY_EVENT, handlePlayRequest);
    return () => {
      window.removeEventListener(DETAIL_PLAY_EVENT, handlePlayRequest);
    };
  }, [videoRef]);

  /**
   * Si el usuario rebobina y vuelve a reproducir tras el "ended", ocultamos
   * el overlay para no obstruir el video, y permitimos que vuelva a
   * dispararse al llegar nuevamente al final.
   */
  const handlePlay = useCallback(() => {
    if (showNextOverlay) setShowNextOverlay(false);
    triggeredByTimeRef.current = false;
  }, [showNextOverlay]);

  /**
   * Al cambiar de video (navegación SPA al siguiente capítulo) el componente
   * se re-monta, pero React puede reutilizar la misma instancia del player
   * con nuevas props: reseteamos el flag explícitamente cuando cambia el
   * contentItemId.
   */
  useEffect(() => {
    setShowNextOverlay(false);
    triggeredByTimeRef.current = false;
    autoplayHandledRef.current = false;
    fullscreenHandledRef.current = false;
  }, [contentItemId]);

  /**
   * Si el `<video>` no cambia de DOM node entre episodios (React reconcilia
   * el mismo nodo), cambiar el atributo `src` via `<source>` no fuerza
   * recarga automáticamente; hay que invocar `.load()` explícitamente. Con
   * esto garantizamos que el autoplay tras el avance del siguiente episodio
   * reproduzca el archivo correcto desde el principio.
   */
  useEffect(() => {
    const el = videoRef.current;
    if (el === null) return;
    try {
      el.load();
    } catch {
      /* noop */
    }
  }, [playback.filePath, videoRef]);

  return (
    <section
      aria-label={`Reproductor de ${title}`}
      className="sf-detail-player"
      id="detail-player"
      ref={shellRef}
    >
      <div
        className={`sf-detail-player-frame${isFullscreen ? " sf-detail-player-frame--fs" : ""}`}
      >
        <video
          className="sf-detail-player-video"
          controls
          /*
           * `controlsList` oculta los controles nativos que no queremos.
           * Añadimos más opciones para que no aparezcan botones extras
           * (miniplayer, descarga, velocidad). El CSS complementa con
           * pseudo-selectores de WebKit/Chromium para hacer el hide
           * confiable incluso en versiones que ignoran `controlsList`.
           */
          controlsList="nofullscreen nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          disableRemotePlayback
          onEnded={handleEnded}
          onLoadedMetadata={handleLoadedMetadata}
          onPause={onPause}
          onPlay={handlePlay}
          onTimeUpdate={handleTimeUpdate}
          playsInline
          poster={posterPath ?? undefined}
          preload="metadata"
          ref={videoRef}
        >
          <source src={playback.filePath} type={playback.mimeType ?? "video/mp4"} />
          Tu navegador no soporta reproducción HTML5 de video.
        </video>
        <button
          aria-label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          className="sf-detail-fs-btn"
          onClick={toggleFullscreen}
          type="button"
        >
          {isFullscreen ? (
            <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
              <path
                d="M14 14h6v2h-4v4h-2v-6zM4 14h6v6H8v-4H4v-2zm10-10h2v4h4v2h-6V4zM4 4h6v2H6v4H4V4z"
                fill="currentColor"
              />
            </svg>
          ) : (
            <svg aria-hidden="true" height="20" viewBox="0 0 24 24" width="20">
              <path
                d="M5 5h6v2H7v4H5V5zm14 0v6h-2V7h-4V5h6zM5 19v-6h2v4h4v2H5zm14 0h-6v-2h4v-4h2v6z"
                fill="currentColor"
              />
            </svg>
          )}
        </button>
        {showNextOverlay && nextEpisode !== null && nextEpisode !== undefined ? (
          <NextEpisodeOverlay
            next={nextEpisode}
            onAdvance={advanceNext}
            onCancel={cancelNext}
          />
        ) : null}
      </div>
    </section>
  );
}

export function DetailPlayerFallback({
  title,
  message,
  posterPath
}: Readonly<{
  title: string;
  message: string;
  posterPath: string | null;
}>) {
  return (
    <section
      aria-label="Reproductor no disponible"
      className="sf-detail-player sf-detail-player--fallback"
      id="detail-player"
    >
      <div className="sf-detail-player-frame sf-detail-player-frame--fallback">
        {posterPath !== null ? (
          <img alt="" aria-hidden="true" className="sf-detail-player-fallback-art" src={posterPath} />
        ) : null}
        <div className="sf-detail-player-fallback-body" role="status">
          <h2 className="sf-detail-player-fallback-title">{title}</h2>
          <p className="sf-detail-player-fallback-text">{message}</p>
        </div>
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ContentHoverCard } from "./content-hover-card";

const PREVIEW_DELAY_MS = 280;
const PREVIEW_DURATION_MS = 8000;
const PREVIEW_START_SECONDS = 0.75;

function hueFromString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type HomeContentCardRestMode = "image-first" | "video-first-when-available";
export type HomeContentCardSize = "default" | "compact";
export type HomeContentCardLayout = "landscape" | "portrait";

export function ContentCard({
  id,
  href,
  title,
  subtitle,
  synopsis,
  previewImagePath,
  previewVideoAssetId,
  typeLabel,
  badgeLabel,
  primaryActionLabel,
  secondaryActionLabel,
  progressPercent,
  progressLabel,
  restMode = "image-first",
  autoPlayPreviewAtRest = false,
  size = "default",
  layout = "landscape"
}: Readonly<{
  id: string;
  href: string;
  title: string;
  subtitle?: string | null | undefined;
  synopsis?: string | null | undefined;
  previewImagePath: string | null;
  previewVideoAssetId: string | null;
  typeLabel?: string | null | undefined;
  badgeLabel?: string | null | undefined;
  primaryActionLabel?: string | undefined;
  secondaryActionLabel?: string | undefined;
  progressPercent?: number | null | undefined;
  progressLabel?: string | null | undefined;
  restMode?: HomeContentCardRestMode | undefined;
  autoPlayPreviewAtRest?: boolean | undefined;
  size?: HomeContentCardSize | undefined;
  layout?: HomeContentCardLayout | undefined;
}>) {
  const hue = hueFromString(id);
  const previewVideoUrl =
    previewVideoAssetId === null ? null : `/api/family/media/${encodeURIComponent(previewVideoAssetId)}`;
  const hasVideoPreview = previewVideoUrl !== null;
  const keepLoadedVideoAtRest =
    hasVideoPreview && (restMode === "video-first-when-available" || previewImagePath === null);
  const shouldAutoPlayAtRest =
    keepLoadedVideoAtRest && autoPlayPreviewAtRest && !prefersReducedMotion();
  /**
   * En modo hover (image-first) mantenemos el póster hasta `playing` para evitar flashes negros.
   * En modo video-first sí permitimos mostrar preview apenas el video esté cargado.
   */
  const hidePosterUntilVideoPlays = previewImagePath !== null && !keepLoadedVideoAtRest;

  const hoverDelayRef = useRef<number | null>(null);
  const stopPreviewRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isInteractive, setIsInteractive] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(keepLoadedVideoAtRest);
  const [showVideo, setShowVideo] = useState(false);

  const showProgressOverlay =
    progressPercent !== null && progressPercent !== undefined && layout === "portrait";

  function clearTimers() {
    if (hoverDelayRef.current !== null) {
      window.clearTimeout(hoverDelayRef.current);
      hoverDelayRef.current = null;
    }

    if (stopPreviewRef.current !== null) {
      window.clearTimeout(stopPreviewRef.current);
      stopPreviewRef.current = null;
    }
  }

  function canShowLoadedPreview(): boolean {
    const video = videoRef.current;
    return video !== null && video.readyState >= 2;
  }

  function resetVideo() {
    const video = videoRef.current;
    if (video === null) {
      return;
    }

    video.pause();
    if (video.readyState >= 1) {
      try {
        video.currentTime = Math.min(PREVIEW_START_SECONDS, Math.max(0, video.duration || PREVIEW_START_SECONDS));
      } catch {
        // Ignore best-effort preview seeks.
      }
    }
  }

  function activatePreview() {
    setIsInteractive(true);

    if (!hasVideoPreview || prefersReducedMotion()) {
      return;
    }

    setShouldLoadVideo(true);
  }

  function deactivatePreview() {
    clearTimers();
    setIsInteractive(false);
    setShowVideo(keepLoadedVideoAtRest && canShowLoadedPreview());
    resetVideo();
  }

  useEffect(() => {
    if (!isInteractive || !hasVideoPreview || prefersReducedMotion()) {
      return undefined;
    }

    hoverDelayRef.current = window.setTimeout(() => {
      const video = videoRef.current;
      if (video === null) {
        return;
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        void playPromise.catch(() => {
          setShowVideo(keepLoadedVideoAtRest && canShowLoadedPreview());
        });
      }

      stopPreviewRef.current = window.setTimeout(() => {
        setShowVideo(keepLoadedVideoAtRest && canShowLoadedPreview());
        resetVideo();
      }, PREVIEW_DURATION_MS);
    }, PREVIEW_DELAY_MS);

    return () => {
      clearTimers();
    };
  }, [hasVideoPreview, isInteractive, keepLoadedVideoAtRest]);

  useEffect(() => {
    if (!shouldAutoPlayAtRest || !shouldLoadVideo || !hasVideoPreview) {
      return undefined;
    }

    function playAtRest() {
      const video = videoRef.current;
      if (video === null) {
        return;
      }

      const playPromise = video.play();
      if (playPromise !== undefined) {
        void playPromise.catch(() => {
          setShowVideo(false);
        });
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        playAtRest();
      } else {
        videoRef.current?.pause();
      }
    }

    if (document.visibilityState === "visible") {
      playAtRest();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [hasVideoPreview, shouldAutoPlayAtRest, shouldLoadVideo]);

  useEffect(() => {
    if (!keepLoadedVideoAtRest || !shouldLoadVideo) {
      return undefined;
    }

    const video = videoRef.current;
    if (video === null) {
      return undefined;
    }

    // Al volver por navegación cliente, el video puede venir ya cargado sin disparar de nuevo eventos.
    if (video.readyState >= 2) {
      setShowVideo(true);
    }

    function onLoadedData() {
      setShowVideo(true);
    }

    video.addEventListener("loadeddata", onLoadedData);
    return () => {
      video.removeEventListener("loadeddata", onLoadedData);
    };
  }, [keepLoadedVideoAtRest, shouldLoadVideo]);

  useEffect(() => {
    return () => {
      clearTimers();
      resetVideo();
    };
  }, []);

  const layoutClass = layout === "portrait" ? " sf-home-card--poster" : "";

  return (
    <Link
      className={`sf-home-card sf-home-card-${size}${layoutClass}${isInteractive ? " is-active" : ""}${showVideo ? " is-previewing" : ""}`}
      href={href}
      onBlur={deactivatePreview}
      onFocus={activatePreview}
      onMouseEnter={activatePreview}
      onMouseLeave={deactivatePreview}
    >
      <div
        className="sf-home-card-media"
        style={{
          background: `linear-gradient(145deg, hsl(${hue}, 52%, 20%), hsl(${(hue + 38) % 360}, 46%, 10%))`
        }}
      >
        {previewImagePath !== null ? (
          <img
            alt=""
            className={`sf-home-card-image${showVideo ? " is-hidden" : ""}`}
            decoding="async"
            key={`${id}:${previewImagePath}`}
            /* lazy en tracks con overflow-x suele no intersectar hasta hover; pocas tarjetas por fila en el home. */
            loading="eager"
            src={previewImagePath}
          />
        ) : null}

        {previewVideoUrl !== null && shouldLoadVideo ? (
          <video
            aria-hidden="true"
            className={`sf-home-card-video${showVideo ? " is-visible" : ""}`}
            muted
            onError={(event) => {
              if (process.env.NODE_ENV !== "production") {
                const err = event.currentTarget.error;
                /* eslint-disable no-console */
                console.warn(
                  "[ContentCard] preview video failed",
                  { src: previewVideoUrl, code: err?.code, message: err?.message }
                );
                /* eslint-enable no-console */
              }
              setShowVideo(false);
            }}
            onLoadedData={() => {
              if (hidePosterUntilVideoPlays) {
                return;
              }
              if (keepLoadedVideoAtRest || isInteractive) {
                setShowVideo(true);
              }
            }}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget;
              if (video.duration > PREVIEW_START_SECONDS) {
                try {
                  video.currentTime = PREVIEW_START_SECONDS;
                } catch {
                  // Ignore preview seek issues on metadata boot.
                }
              }
            }}
            onPause={() => {
              if (shouldAutoPlayAtRest && !isInteractive) {
                setShowVideo(false);
              }
            }}
            onPlaying={() => setShowVideo(true)}
            playsInline
            preload={keepLoadedVideoAtRest ? "auto" : "metadata"}
            ref={videoRef}
            src={previewVideoUrl}
          />
        ) : null}

        <div className="sf-home-card-shade" />

        <div className="sf-home-card-topline">
          {badgeLabel ? <span className="sf-home-card-badge">{badgeLabel}</span> : <span />}
          {typeLabel ? <span className="sf-home-card-chip">{typeLabel}</span> : null}
        </div>

        <ContentHoverCard
          active={isInteractive}
          primaryActionLabel={primaryActionLabel}
          progressLabel={progressLabel}
          progressPercent={showProgressOverlay ? null : progressPercent}
          secondaryActionLabel={secondaryActionLabel}
          subtitle={subtitle}
          synopsis={synopsis}
          title={title}
        />

        {showProgressOverlay ? (
          <div className="sf-home-card-progress sf-home-card-progress--overlay" role="presentation">
            <div className="sf-home-card-progress-track">
              <span
                className="sf-home-card-progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, Math.round(progressPercent)))}%` }}
              />
            </div>
          </div>
        ) : null}

        {previewImagePath === null && previewVideoUrl === null ? (
          <span className="sf-home-card-initial">
            {(title.slice(0, 1) || "?").toUpperCase()}
          </span>
        ) : null}
      </div>

      <div className="sf-home-card-body">
        <p className="sf-home-card-title">{title}</p>
        {subtitle ? <p className="sf-home-card-subtitle">{subtitle}</p> : null}

        {!showProgressOverlay && progressPercent !== null && progressPercent !== undefined ? (
          <div className="sf-home-card-progress">
            <div className="sf-home-card-progress-track" role="presentation">
              <span
                className="sf-home-card-progress-fill"
                style={{ width: `${Math.max(0, Math.min(100, Math.round(progressPercent)))}%` }}
              />
            </div>
            {progressLabel ? <p className="sf-home-card-progress-label">{progressLabel}</p> : null}
          </div>
        ) : null}
        {showProgressOverlay && progressLabel ? (
          <p className="sf-home-card-progress-label">{progressLabel}</p>
        ) : null}
      </div>
    </Link>
  );
}

"use client";

import { useCallback, useEffect, useRef } from "react";

const SAVE_INTERVAL_MS = 7000;
const MIN_PROGRESS_SECONDS = 2;

export function usePlaybackProgress({
  contentItemId,
  initialProgressSeconds
}: Readonly<{
  contentItemId: string;
  initialProgressSeconds: number | null;
}>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hydratedInitialRef = useRef(false);
  /** `null` = aún no hubo ningún envío; evita bloquear el primer guardado con `now - 0 < interval`. */
  const lastSentAtRef = useRef<number | null>(null);
  const lastSentProgressRef = useRef(0);

  const sendProgress = useCallback(
    async (opts: { force?: boolean; ended?: boolean } = {}) => {
      const el = videoRef.current;
      if (el === null) {
        return;
      }
      const now = Date.now();
      const progressSeconds = Math.max(0, el.currentTime);
      const durationSeconds = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : null;

      if (progressSeconds < MIN_PROGRESS_SECONDS) {
        return;
      }

      if (!opts.force) {
        if (
          lastSentAtRef.current !== null &&
          now - lastSentAtRef.current < SAVE_INTERVAL_MS
        ) {
          return;
        }
        if (Math.abs(progressSeconds - lastSentProgressRef.current) < 2) {
          return;
        }
      }

      lastSentAtRef.current = now;
      lastSentProgressRef.current = progressSeconds;

      try {
        await fetch("/api/family/history/upsert", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contentItemId,
            progressSeconds,
            durationSeconds,
            ended: opts.ended === true
          }),
          keepalive: true
        });
      } catch {
        // Fallback silencioso: la UI de reproducción no debe romperse por telemetría de progreso.
      }
    },
    [contentItemId]
  );

  useEffect(() => {
    function flush() {
      void sendProgress({ force: true });
    }

    function onVisibility() {
      if (document.visibilityState === "hidden") {
        flush();
      }
    }

    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [sendProgress]);

  const onLoadedMetadata = useCallback(() => {
    const el = videoRef.current;
    if (el === null || hydratedInitialRef.current) {
      return;
    }
    hydratedInitialRef.current = true;

    if (
      initialProgressSeconds === null ||
      initialProgressSeconds < MIN_PROGRESS_SECONDS ||
      !Number.isFinite(el.duration) ||
      el.duration <= 0
    ) {
      return;
    }

    const resumeAt = Math.min(initialProgressSeconds, Math.max(0, el.duration - 1));
    if (resumeAt >= MIN_PROGRESS_SECONDS) {
      el.currentTime = resumeAt;
    }
  }, [initialProgressSeconds]);

  const onTimeUpdate = useCallback(() => {
    void sendProgress();
  }, [sendProgress]);

  const onPause = useCallback(() => {
    void sendProgress({ force: true });
  }, [sendProgress]);

  const onEnded = useCallback(() => {
    void sendProgress({ force: true, ended: true });
  }, [sendProgress]);

  return {
    videoRef,
    onLoadedMetadata,
    onTimeUpdate,
    onPause,
    onEnded
  };
}


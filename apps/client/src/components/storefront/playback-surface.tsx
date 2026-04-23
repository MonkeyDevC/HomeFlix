"use client";

import type { PlaybackDetailPayload } from "@homeflix/contracts";
import { useEffect, useState } from "react";
import { fetchPlaybackDetail } from "../../lib/api/api-http-client";
import { systemMessage } from "../../lib/system-messages";
import { useProfileSession } from "./profile-context";
import { ErrorStateBlock } from "./error-state-block";
import { FamilyPlaybackDeferred } from "./family-playback-deferred";

function reasonMessage(reason: PlaybackDetailPayload["unavailableReason"]): string {
  switch (reason) {
    case "no_primary_media":
      return "Este título no tiene un media primario vinculado en el catálogo.";
    case "media_not_ready":
      return "El asset técnico aún no está listo según la API legado.";
    case "missing_playback_id":
      return "Aún no hay identificador de reproducción resuelto para este asset.";
    case "requires_signed_playback":
      return "Este asset requiere reproducción firmada; inicia sesión con permiso o revisa la configuración de firma en la API.";
    case "playback_signing_not_configured":
      return "La API legado no puede firmar playback; Family V1 usará archivos locales en FASE 2.";
    default:
      return "Reproducción no disponible.";
  }
}

export function PlaybackSurface({
  apiBaseUrl,
  contentItemSlug,
  autoplay: _autoplay
}: Readonly<{
  apiBaseUrl: string;
  contentItemSlug: string;
  autoplay: boolean;
}>) {
  const { activeProfileId, loading: profileLoading } = useProfileSession();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [payload, setPayload] = useState<PlaybackDetailPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setMessage(null);

    void (async () => {
      const result = await fetchPlaybackDetail(
        apiBaseUrl,
        contentItemSlug,
        profileLoading ? undefined : activeProfileId
      );

      if (cancelled) {
        return;
      }

      if (result.state !== "ok") {
        setState("error");
        const hint =
          result.statusCode === 401
            ? " Necesitas iniciar sesión para reproducir contenido protegido."
            : result.statusCode === 403
              ? " Tu cuenta no tiene permiso para reproducir este contenido."
              : "";
        setMessage(`${result.message}${hint}`);
        return;
      }

      setPayload(result.data);
      setState("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [activeProfileId, apiBaseUrl, contentItemSlug, profileLoading]);

  useEffect(() => {
    if (state === "error" && message !== null) {
      systemMessage.error("No se pudo resolver el playback", message);
    }
  }, [message, state]);

  if (state === "loading" || payload === null) {
    return (
      <section className="sf-playback" aria-busy="true" aria-label="Reproductor">
        <div className="sf-player-loading">Preparando reproducción…</div>
      </section>
    );
  }

  if (state === "error" && message !== null) {
    return (
      <section className="sf-playback" aria-label="Reproductor">
        <ErrorStateBlock title="No se pudo resolver el playback" message={message} />
      </section>
    );
  }

  if (!payload.canPlay || payload.muxPlaybackId === null) {
    return (
      <section className="sf-playback" aria-label="Reproductor">
        <div className="sf-player-fallback" role="status">
          <h2 className="sf-player-fallback-title">Aún no se puede reproducir</h2>
          <p>{reasonMessage(payload.unavailableReason)}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="sf-playback" aria-label="Reproductor">
      {activeProfileId === null ? (
        <p className="sf-player-profile-hint" role="note">
          Sin perfil activo: el progreso seguirá ligado a la API legado hasta migrar a
          Family V1. Elige un perfil en <a href="/profiles">Perfiles</a>.
        </p>
      ) : null}
      <FamilyPlaybackDeferred
        detail="El catálogo legado marca este título como reproducible, pero el cliente Family V1 aún no reproduce (FASE 2: archivos locales)."
      />
    </section>
  );
}

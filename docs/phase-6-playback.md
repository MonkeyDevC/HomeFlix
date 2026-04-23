# FASE 6 — Reproducción real (Mux) y progreso (WatchHistory)

## Objetivo

Player **Mux** en el detalle (`/c/[slug]`), resolución de playback vía API, persistencia de progreso con `POST /api/v1/profiles/:id/watch-history`, y fila **Seguir viendo** alimentada por `GET /api/v1/profiles/:id/continue-watching` (sin mocks como fuente de verdad).

## Contratos

- **`PlaybackDetailPayload` / `GET /api/v1/content-items/:id/playback?profileId=`**  
  Devuelve `canPlay`, `muxPlaybackId` (para `@mux/mux-player-react`), `startPositionSeconds` (resume desde WatchHistory), `unavailableReason` cuando no aplica playback público.
- **`ContinueWatchingPayload` / `GET /api/v1/profiles/:id/continue-watching`**  
  Entradas no completadas con `progressSeconds >= 2`, orden `lastWatchedAt` descendente.

## Política `signed` (actualizado en FASE 7)

En **FASE 7**, si el usuario está autorizado y la API tiene credenciales de firma Mux (`MUX_SIGNING_KEY` / `MUX_PRIVATE_KEY`), `canPlay` puede ser `true` y el payload incluye `muxPlaybackToken` para `tokens.playback` en el player. Si falta configuración de firma, ver `unavailableReason === "playback_signing_not_configured"`. Detalle en `docs/phase-7-security.md`.

## Cliente

- `@mux/mux-player-react` + `@mux/mux-player` (tipos), carga dinámica `ssr: false`.
- Progreso: throttle ~8 s, flush en `pause`, fin de vídeo, casi-fin (≥ ~97 % duración), `visibilitychange` / `pagehide`.
- `?autoplay=1` en detalle: autoplay **muted** (política típica del navegador); CTA hero «Reproducir ahora» lo usa.
- Sin perfil activo: el vídeo puede verse pero **no** se llama a upsert (hint en UI).
- Todas las llamadas de catálogo/playback exigen **sesión Bearer** (FASE 7); ver doc de seguridad.

## Validación

`corepack pnpm check` debe pasar. La reproducción real requiere asset Mux `ready`, `playbackId`, sesión válida y, si la política es `signed`, claves de firma en el servidor.

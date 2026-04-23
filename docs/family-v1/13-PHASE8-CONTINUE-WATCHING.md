# FASE 8 — Historial, progreso por perfil y Continue Watching

## Objetivo

Agregar persistencia simple y confiable de reproducción en Family V1:

- historial por perfil (`WatchHistory`)
- guardado de progreso en reproducción local HTML5
- fila "Seguir viendo" en Home del perfil activo
- reanudación automática desde progreso previo

## Decisiones

- Fuente de verdad única: **DB (`family_v1.watch_history`)**.
- Persistencia por clave única `(profileId, contentItemId)`.
- Sin localStorage como autoridad.
- Sin polling agresivo; guardado por eventos del `<video>`.

## Modelo

`WatchHistory` incorpora `duration_seconds` opcional para calcular umbral de completado:

- `progress_seconds`
- `duration_seconds` nullable
- `completed_at` nullable
- `updated_at`

Completado: `ended=true` o progreso >= 95% de duración.

## Endpoints Family

- `POST /api/family/history/upsert`
  - valida sesión + perfil activo
  - valida contenido visible para el perfil (`published + ProfileContentAccess`)
  - valida asset reproducible local (`resolveLocalPlaybackForContent`)
  - ignora progreso `< 2s`
  - actualiza o crea `WatchHistory`
- `GET /api/family/history/continue-watching`
  - sesión + perfil activo obligatorios
  - devuelve solo no completados
  - orden por `updatedAt desc`

## Storefront / Player

- `LocalVideoPlayer` usa `usePlaybackProgress`:
  - `onTimeUpdate` con throttle (~7s)
  - `onPause` guardado forzado
  - `onEnded` marca completado
- Reanudación automática:
  - `/c/[slug]` consulta progreso del perfil y lo inyecta al player
  - al cargar metadata, el player hace seek al progreso guardado
- Home Family:
  - primera fila funcional: `ContinueWatchingRow`
  - tarjetas con barra visual de avance
  - vacío: no se muestra

## Fuera de alcance

Analytics, recomendaciones complejas, sincronización avanzada multi-dispositivo, buffering inteligente y autoplay sofisticado.


# FASE 6 — Detalle reproducible con HTML5 video

## Objetivo

Conectar `ContentItem` editorial con `MediaAsset` local para que `/c/[slug]` reproduzca video real en Family V1.

## Decisiones

- Detalle server-side por perfil activo con regla cerrada:
  - `published`
  - fila `ProfileContentAccess`
- Resolución técnica de playback local:
  - `MediaAsset` más reciente del contenido
  - estado `ready`
  - MIME `video/*`
  - archivo físico existente en `public/storage/...`
- Reproducción con `<video>` HTML5 nativo (sin player externo).

## Piezas nuevas

- Helper dominio/servidor: `getContentDetailForActiveProfile` y `resolveLocalPlaybackForContent`.
- Contratos Family: `ContentDetailFamilyDto`, `LocalPlaybackDto`, `LocalPlaybackStateFamily`.
- Vista detalle Family: metadata + player + fallbacks claros.
- Endpoint técnico:
  - `GET /api/family/content/[slug]/detail`

## Estados de reproducción

- `ready` → reproduce con `<video>`.
- `missing_media` → contenido sin video local.
- `asset_unusable` → asset existe pero no es reproducible.
- `file_missing` → DB apunta a archivo que no existe en disco.

## Fuera de alcance

Autoplay avanzado, mini-player, continue watching final, analytics, transcodificación o streaming adaptativo.


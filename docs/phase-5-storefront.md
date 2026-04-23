# FASE 5 — Storefront tipo Netflix (consumo vía API)

## Objetivo

Superficie de consumo en `apps/client` inspirada en plataformas VOD modernas: home con hero y filas horizontales, detalle de `ContentItem`, búsqueda básica, selector de perfiles y fila opcional «Seguir viendo» desde `WatchHistory`. **Sin reproductor** (FASE 6).

## Contratos y endpoints

- **`CatalogHomePreviewPayload`**: `featured`, `collections`, `rows` (solo ítems `editorialStatus === "published"` en filas y destacados).
- **`GET /api/v1/catalog/home-preview`**: agrega datos para la home (puede implicar varias lecturas por colección).
- **`CatalogSearchPayload`**: `query` + `results`.
- **`GET /api/v1/catalog/search?q=`**: búsqueda insensible a mayúsculas en título, slug y sinopsis; solo publicados. Consulta vacía → resultados vacíos sin error.
- Lecturas existentes reutilizadas: `GET /api/v1/content-items/:id`, `GET /api/v1/profiles`, `GET /api/v1/profiles/:id/watch-history`.

## Cliente

- Navegación: `/` (home), `/c/[slug]`, `/search`, `/profiles`, `/dev` (probes técnicos FASE 2–4).
- Datos: **solo API** (`catalog-storefront-fetch.ts` en RSC + `api-http-client.ts` en cliente).
- Perfil activo: `localStorage` (`homeflix.activeProfileId`), sin auth de viewers.

## Datos vacíos

Si no hay contenido publicado, la UI muestra mensajes honestos; se puede usar el fixture/script de catálogo de FASE 3 para poblar.

## Fuera de alcance

Player, playback firmado, RBAC final, analytics, recomendaciones, consumo directo de Directus.

# FASE 5 — Upload local y media básica

## Objetivo

Implementar upload local simple y mantenible en el monolito (`apps/client`) para:

- video MP4 (vía `MediaAsset`)
- poster (ruta en `ContentItem.posterPath`)
- thumbnail (ruta en `ContentItem.thumbnailPath`)

Sin Mux, sin proveedores externos y sin pipeline complejo.

## Decisiones

- Upload por `multipart/form-data` en APIs admin.
- Validación explícita de tamaño, extensión y MIME.
- Nombres únicos (`timestamp + uuid`).
- Escritura física en disco bajo `public/storage/{videos|posters|thumbnails}`.
- Persistencia en Prisma:
  - `MediaAsset` para video (estado `ready`, `sizeBytes`, `mimeType`, `filePath`).
  - `ContentItem.posterPath` / `thumbnailPath` para imágenes.

## Endpoints nuevos

- `GET /api/family/admin/content/[id]/media`
- `POST /api/family/admin/content/[id]/media/video`
- `POST /api/family/admin/content/[id]/media/poster`
- `POST /api/family/admin/content/[id]/media/thumbnail`

Todos con guard `requireAdminApi`.

## UI admin

En `/admin/content/[id]` se agrega sección de media con:

- estado actual de video/poster/thumbnail
- upload/reemplazo de cada archivo
- mensajes inline de validación y éxito

## Límites y formatos

- Video: `video/mp4` / `video/quicktime`, `.mp4` / `.mov`, máx. 5 GiB.
- Imagen (poster/thumbnail): `image/jpeg|png|webp`, `.jpg|.jpeg|.png|.webp`, máx. 10 MiB.

## Fuera de alcance

Player final, transcodificación, HLS/DASH, múltiples resoluciones, CDN y procesamiento asíncrono.


# Decisiones de FASE 0

Este documento conserva las decisiones originales de FASE 0 como base arquitectónica. FASE 1 no las invalida; las operacionaliza con Fastify, Directus y PostgreSQL.

## 1. Monorepo pnpm

Se usa pnpm workspace porque permite separar apps y paquetes compartidos sin convertir HomeFlix en un monolito. La estructura base queda en `apps/*` y `packages/*`.

## 2. Tripartición explícita

HomeFlix queda separado en:

- `apps/client`
- `apps/api`
- `apps/cms`

Esta separación evita mezclar storefront, backend y administración editorial.

## 3. Client en Next.js

El client usa Next.js + TypeScript como base. En FASE 0 solo existe un shell técnico para fijar dirección de app, configuración y tooling.

## 4. API en Node.js nativo

El API usa Node.js + TypeScript con HTTP nativo para evitar instalar framework antes de tener rutas y necesidades reales. FASE 1 puede introducir Fastify, Hono u otro framework si el crecimiento lo justifica.

## 5. CMS documentado como Directus

La decisión de roadmap para CMS es Directus, pero no se instala en FASE 0. Motivos:

- Evita ruido de dependencias y configuración antes de decidir base de datos.
- Encaja con una superficie editorial desacoplada.
- Permite modelar `content_item` y referencias a `media_asset` sin mezclarlo con el client.
- Mantiene el repositorio listo para una instalación controlada en una fase posterior.

## 6. `content_item` y `media_asset` son modelos separados

`content_item` representa intención editorial: título, slug, sinopsis, visibilidad y estado de publicación.

`media_asset` representa el activo técnico: proveedor, playback id, duración, política de reproducción y estado de procesamiento.

Un contenido puede existir como borrador sin asset técnico listo. Un asset puede estar procesando aunque el contenido todavía no sea publicable.

## 7. Estados mínimos

`ContentItemStatus` incluye:

- `draft`
- `published`
- `archived`

`archived` se incluye para retirar contenido sin borrarlo ni confundirlo con un borrador.

`MediaAssetStatus` incluye:

- `draft`
- `processing`
- `ready`
- `failed`

No se agregan estados intermedios hasta tener integración real con proveedor de video.

## 8. Video por direct upload

El backend de aplicación no será el transporte principal del binario de video. En fases futuras podrá emitir intención de subida, firmar permisos o recibir webhooks, pero el archivo viajará directamente al proveedor.

## 9. Media pipeline contract

FASE 0 congela tres contratos sin implementarlos:

- `CreateUploadRequest`
- `CreateUploadResponse`
- `MediaWebhookEvent`

Estos contratos fijan direct upload, webhook y transicion tecnica a `ready` o `failed`.

## 10. Playback contract

FASE 0 congela `PlaybackRequest` y `PlaybackResponse`.

El API sera el owner futuro de permisos y playback URL. El client no debe consultar el CMS para reproducir.

## 11. Naming definitivo del dominio

Los nombres canonicos antes de FASE 1 son:

- `ContentItem`
- `MediaAsset`
- `Collection`
- `Category`
- `Profile`

No se deben renombrar sin una ADR explicita.

## 12. Sin features fuera de FASE 0

No se implementa auth, CRUD, catálogo, reproducción, backoffice real ni proveedor de video. Cualquier placeholder existe solo para fijar estructura.

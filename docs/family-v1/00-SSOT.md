# SSOT — HomeFlix Family V1

## Qué es Family V1

- Aplicación **familiar**, **privada**, pensada para **un solo VPS** y pocos usuarios.
- **Monolito Next.js** (App Router) **full-stack**: UI + route handlers / server actions + capa de servicios en el mismo deploy.
- **PostgreSQL + Prisma** como persistencia única del producto Family V1.
- **Vídeo y assets en disco local** servidos por la app (o proxy estático); **sin** CDN de video de terceros ni pipeline Mux.
- **Sin Directus**: el admin es **parte de la misma app** (`/admin`), no un CMS externo.
- **Catálogo filtrado por perfil**: un `ContentItem` solo es visible en storefront si está **publicado** y existe **acceso explícito** vía `ProfileContentAccess` (sin fallback implícito “todos ven todo”).

## Qué no es Family V1

- No es una plataforma OTT enterprise multi-tenant.
- No es arquitectura tripartita **cliente + API Fastify + CMS** como eje de producto.
- No depende de **Mux**, **webhooks de proveedor**, **signed playback enterprise**, ni **Consola Dev** como producto.

## Decisiones cerradas (FASE 0)

| Tema | Decisión |
|------|-----------|
| Runtime principal | Un solo proceso Next.js (build único). |
| Datos | Prisma + PostgreSQL; esquema `family_v1` en el monolito (FASE 1–2); sin duplicar modelo “enterprise” en paralelo. |
| Admin | Rutas bajo `/admin`, auth interna (detalle en FASE 1). |
| Storefront | Rutas bajo grupo `(storefront)` existente; evolución hacia catálogo por perfil sin Directus. |
| Auth usuario | Rutas bajo `/auth/*`; convivencia temporal con `/login` legacy documentada en `05-V2_DISPOSITION.md`. |
| Media | `MediaAsset` = archivo local administrado por la app (path, mime, duración opcional); **no** `provider_upload_id` como fuente de verdad. |
| Visibilidad | `ProfileContentAccess(profileId, contentItemId)` obligatorio para listar ítem en storefront (además `editorialStatus = published`). |

## Roadmap de alto nivel (post FASE 0)

1. **FASE 1**: Prisma en monolito, esquema `family_v1`, rutas internas mínimas (ver `06-PHASE1-TECH.md`).
2. **FASE 2**: dominio Prisma simplificado, `ProfileContentAccess` como regla de catálogo por perfil, contratos TS alineados (ver `07-PHASE2-DOMAIN.md`).
3. **FASE 3**: auth monolito (cookies JWT), perfil activo, protección `/admin` y storefront; ver `08-PHASE3-AUTH.md`.
4. **FASE 4+**: CRUD admin, uploads locales, player, despliegue VPS.

## Referencia conceptual V2

La documentación histórica en `docs/phase-*` y el código en `apps/api`, `apps/cms`, paquetes `contracts` orientados a Mux/API pueden leerse **solo** como referencia de dominio o anti-patrones a evitar, **no** como SSOT de Family V1.

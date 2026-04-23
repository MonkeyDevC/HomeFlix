# FASE 7 — Seguridad de acceso y reproducción

## Objetivo

Endurecer el consumo del catálogo y la reproducción: **JWT de sesión** emitido por la API, **RBAC mínimo** (`admin` | `viewer`), **playback firmado Mux** cuando `playbackPolicy === "signed"`, reglas de **visibilidad + estado editorial** en la API, y **rutas sensibles** protegidas (catálogo autenticado, uploads/resúmenes de media solo admin, `/dev` solo admin en el cliente).

## Autenticación

- **Transporte**: cabecera `Authorization: Bearer <access_token>` (HS256, secreto `HOMEFLIX_JWT_SECRET` / default solo desarrollo).
- **Login**: `POST /api/v1/auth/login` con `{ "email", "password" }`.
- **Sesión actual**: `GET /api/v1/auth/me` (mismo Bearer).
- **Cliente**: el token se guarda en `localStorage` bajo la clave `homeflix.accessToken`. No sustituye el control en servidor; solo permite que el navegador adjunte el Bearer en las peticiones al catálogo.

### Usuarios de ejemplo (seed)

Tras aplicar migraciones Prisma, existen usuarios de desarrollo:

- **Admin**: `admin@homeflix.local` — perfiles listados en login para operar, rutas de media administrativas y gate `/dev`.
- **Viewer**: `viewer@homeflix.local` — solo perfiles con `user_id` propio; catálogo según visibilidad.

Contraseña de desarrollo (ambos, solo local): **`homeflix-dev`** (definida en la migración `phase_7_documented_dev_password`).

## Autorización de catálogo y playback

- Todos los endpoints bajo el prefijo de catálogo de consumo exigen **Bearer válido** (plugin anidado en `v1.routes`).
- **Visibilidad**: reglas centralizadas en `packages/domain` (`canAccessContentItemForConsumption`): borradores / no publicados no visibles en storefront público; `private` solo `admin`; `household` / `public-internal` para `viewer` autenticado según el modelo.
- **Perfiles**: un `viewer` solo puede usar perfiles con `userId` coincidente; `admin` puede listar todos.
- **Playback firmado**: si el asset primario tiene `playbackPolicy === "signed"`, la API firma con `@mux/mux-node` cuando existen `MUX_SIGNING_KEY` y `MUX_PRIVATE_KEY` (y opcionalmente credenciales Mux de API). Si faltan credenciales, la API responde con payload `canPlay: false` y `unavailableReason: "playback_signing_not_configured"` (sin exponer secretos).

## Media assets

- `POST /api/v1/media-assets/uploads`, `GET /api/v1/media-assets/:id` y `.../status` requieren **admin** además del Bearer.
- El webhook Mux permanece **público** (firma Mux propia).

## Cliente Next.js

- El **storefront** carga catálogo / búsqueda / detalle **en el cliente** cuando hay token, porque el layout RSC no tiene acceso al `localStorage`.
- **Signed playback**: `@mux/mux-player-react` recibe `tokens={{ playback: <jwt> }}` cuando la API devuelve `muxPlaybackToken`.
- **`/login`**: formulario que llama a `POST /auth/login` y persiste el token.
- **`/dev`**: comprobación de rol `admin` vía `GET /auth/me` antes de mostrar herramientas.

## Variables de entorno relevantes (API)

| Variable | Uso |
|----------|-----|
| `HOMEFLIX_JWT_SECRET` | Firma del access token |
| `DATABASE_URL` | Prisma; sin esto no hay login real |
| `MUX_SIGNING_KEY` / `MUX_PRIVATE_KEY` | Firma JWT de playback Mux |
| `MUX_TOKEN_ID` / `MUX_TOKEN_SECRET` | Opcional para cliente Mux en servidor |

## Fuera de alcance (FASE 7)

- Observabilidad / CI (FASE 8).
- IAM enterprise, SSO, cookies httpOnly de producción (se puede añadir después sin cambiar el modelo de autorización en API).

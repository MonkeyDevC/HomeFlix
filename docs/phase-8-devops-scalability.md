# FASE 8 — Hardening operacional y escalabilidad inicial

## Objetivo

Dejar HomeFlix **reproducible en Docker**, con **health / readiness / status** claros, **logs estructurados** (Pino) sin filtrar secretos, **scripts de verificación**, **runbook** de arranque y línea base de **performance** (mitigación N+1 en home preview). Sin Kubernetes, sin stacks de observabilidad enterprise.

## Endpoints de diagnóstico (API)

| Ruta | Rol |
|------|-----|
| `GET /health` | **Liveness**: proceso vivo; no comprueba Postgres. |
| `GET /ready` | **Readiness**: `SELECT 1` contra Postgres si `DATABASE_URL` está definida. HTTP **503** si la URL existe pero la base no responde. Sin `DATABASE_URL`: HTTP **200** con `ready: false` y check `skipped`. |
| `GET /api/v1/ready` | Mismo contrato que `/ready` (útil detrás del mismo prefijo que otros servicios). |
| `GET /api/v1/status` | Diagnóstico de dependencias (Postgres, Directus probe, Mux). `status` agregado: **`ok`** si Postgres y credenciales Mux de upload están configuradas; **`degraded`** en caso contrario. |

Contrato JSON de readiness: `ReadinessResponse` en `@homeflix/contracts`.

## Logging

- **Pino** vía Fastify: nivel `LOG_LEVEL` (default `info`).
- **Redacción**: cabeceras `authorization`, `cookie`, `x-api-key` no se escriben en logs.
- **Línea estructurada** al final de cada respuesta: `event: http_request_complete`, `method`, `url`, `statusCode`, `durationMs`, `reqId`.
- Errores: mensajes estructurados; stack solo si `HOMEFLIX_ENV=development`.

No se loguean cuerpos de petición ni variables de entorno completas.

## Docker Compose

- **`docker compose -f docker-compose.dev.yml up postgres directus`** (por defecto): igual que antes, datos y CMS local.
- **Perfil `apps`**: API + cliente Next compilados en imagen.

```bash
docker compose -f docker-compose.dev.yml --profile apps up --build
```

o desde el monorepo:

```bash
corepack pnpm stack:up
```

### Variables importantes en contenedores

- **API**: `DATABASE_URL` apunta al host `postgres` del compose (no `localhost`).
- **Cliente**: `NEXT_PUBLIC_HOMEFLIX_API_BASE_URL` se inyecta en **build** del Dockerfile; desde el navegador en el host suele ser `http://localhost:4000`.
- **Mux / JWT**: pasar secretos vía `.env` en la raíz o `environment:` en override; **no** commitear valores reales.

### Migraciones antes de la API en Docker

La imagen **no** ejecuta `prisma migrate` al arrancar. Tras levantar Postgres:

```bash
corepack pnpm db:migrate
```

(o `docker compose run --rm api sh -lc "cd /repo/apps/api && pnpm exec prisma migrate deploy"` si el contenedor tiene las herramientas; el Dockerfile actual solo incluye el artefacto `dist` — en la práctica migrar desde el host contra `localhost:5432` es lo más simple).

## Scripts operacionales

| Script | Descripción |
|--------|-------------|
| `corepack pnpm infra:check` | Comprueba Docker / Compose en el host. |
| `corepack pnpm ops:compose-config` | Valida sintaxis de `docker-compose.dev.yml`. |
| `corepack pnpm ops:smoke` | HTTP smoke contra `/health`, `/ready`, `/api/v1/status` (base URL por defecto `http://localhost:4000`). |
| `corepack pnpm cms:verify` | Directus editorial (ya existente). |

## Performance (FASE 8)

- **Home preview**: las filas por colección dejan de hacer una consulta por colección; se usa `listCollectionItemsForCollections` (una consulta + agrupación en memoria).

## CDN y entrega de medios

- **Mux** sirve el vídeo (HLS) desde la CDN de Mux; el storefront solo recibe `playbackId` / tokens firmados desde **la API** (FASE 6–7).
- **Next.js** puede desplegarse detrás de un reverse proxy (nginx, Caddy, load balancer) que termine TLS y aplique cabeceras de caché a estáticos (`/_next/static`).
- **API**: exponer solo lo necesario; CORS ya usa `CLIENT_ORIGIN`.

No se introduce CDN propietaria ni edge logic compleja en esta fase.

## Runbook rápido (local)

1. `corepack pnpm install`
2. `corepack pnpm infra:check` y `docker compose -f docker-compose.dev.yml up -d postgres directus`
3. Copiar `.env.example` → `.env` y ajustar secretos
4. `corepack pnpm db:migrate`
5. `corepack pnpm dev:api` y `corepack pnpm dev:client` (o `stack:up` con perfil `apps`)
6. `corepack pnpm ops:smoke` con la API levantada

## Fuera de alcance (FASE 8)

- Kubernetes, Terraform multi-entorno, APM/ELK/Prometheus completos.
- Cookies httpOnly para JWT (solo documentado como evolución posible).
- Multi-región, autoscaling automático, SLO formales.

## Bloqueos ambientales honestos

- Sin **Docker**, `ops:compose-config` y el stack en contenedores no son verificables en CI local.
- **Directus** requiere imagen `directus/directus:11` descargable; el snapshot/runbook sigue en `apps/cms/`.
- **Mux**: sin credenciales, el `status` marcará `degraded` para media-provider; el playback firmado sigue condicionado a claves (FASE 7).

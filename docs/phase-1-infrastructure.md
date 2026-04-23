# FASE 1 Infrastructure

FASE 1 convierte la cimentación de FASE 0 en infraestructura local verificable.

## Decisiones

- API: Fastify + TypeScript.
- Client: Next.js + TypeScript.
- CMS: Directus self-hosted con Docker Compose.
- Database: PostgreSQL local de desarrollo con Docker Compose.
- Client consume API, nunca Directus directo.
- API mantiene auth foundation sin auth productiva.

## Servicios

| Servicio | Puerto | Comando |
| --- | --- | --- |
| Client | `3000` | `corepack pnpm dev:client` |
| API | `4000` | `corepack pnpm dev:api` |
| Directus | `8055` | `corepack pnpm dev:cms` |
| PostgreSQL | `5432` | `corepack pnpm dev:db` |

## Flujo local recomendado

1. `corepack pnpm install`
2. `corepack pnpm infra:check`
3. `corepack pnpm dev:infra`
4. `corepack pnpm dev:api`
5. `corepack pnpm dev:client`

## Endpoints API

- `GET /health`
- `GET /api/v1`
- `GET /api/v1/health`
- `GET /api/v1/status`
- `GET /api/v1/auth/foundation`

## Auth foundation

FASE 1 define que `apps/api` sera owner de una estrategia futura `api-issued-session-token` transportada por `authorization-header`.

No hay login, refresh token, RBAC final ni sesiones productivas.

## CMS

Directus administra el backoffice editorial. Su auth pertenece al CMS y no se mezcla con la auth futura del client.

El schema editorial final queda diferido para fases posteriores.

## PostgreSQL

PostgreSQL queda disponible para Directus y preparado para persistencia futura del API. FASE 1 no introduce ORM final ni migraciones de dominio masivas.

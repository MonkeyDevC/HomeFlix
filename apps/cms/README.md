# HomeFlix CMS

`apps/cms` is the editorial and administrative workspace for HomeFlix.

## Decision

Directus is the CMS for the project.

Reasons:

- It keeps backoffice work separate from the public storefront.
- It lets HomeFlix model editorial content without turning the API into a CMS.
- It fits the API-first architecture where `apps/api` remains the public orchestration boundary.
- It can later coordinate editorial relationships to technical media assets without transporting video binaries through Fastify.

## FASE 4 Status (backoffice operable)

Directus runs on the **same PostgreSQL** as `apps/api` (see `docker-compose.dev.yml`). Las tablas editoriales las crea **Prisma**; Directus **importa** esas tablas en Studio para CRUD real.

- Runbook de importación: `bootstrap/IMPORT-RUNBOOK.md`
- Visión FASE 4 y estrategia: `../docs/phase-4-backoffice.md`
- Verificación (requiere Docker + Directus arriba): desde la raíz, `corepack pnpm cms:verify`
- Snapshots CLI (opcional): `snapshot/README.md`
- Operación / stack completo: `../docs/phase-8-devops-scalability.md`

Directus es la fuente de **autoría** editorial; la API sigue siendo la orquestación pública y el dueño del pipeline técnico Mux. El client no habla con Directus.

## Commands

From the repository root:

```bash
corepack pnpm infra:check
corepack pnpm dev:db
corepack pnpm dev:cms
corepack pnpm dev:infra
```

From `apps/cms`:

```bash
corepack pnpm dev
corepack pnpm db
corepack pnpm down
```

## Ports

- Directus: `http://localhost:8055`
- PostgreSQL: `localhost:5432`

## PostgreSQL

The local database is created by Docker Compose:

- database: `homeflix`
- user: `homeflix`
- password: `homeflix_dev_password`

These values are for local development only.

## Future Role

The CMS will administer:

- `ContentItem`
- `Category`
- `Collection`
- editorial association with `MediaAsset`
- editorial metadata
- publication state

The CMS controls `ContentItem.status`. It does not control `MediaAsset.status`, which is observed from Mux webhook events by the API.

The CMS is not:

- the public consumption experience
- the video player
- the primary binary video transport
- the public API consumed by `apps/client`

## Deferred beyond FASE 4

- RBAC fino y roles de negocio en Studio.
- Workflows avanzados y automatizaciones.
- Sync jobs explícitos si algún día Directus deja de compartir base con la API.

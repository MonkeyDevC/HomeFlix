# HomeFlix

> **Estado actual: HomeFlix Family V1 (FASE 9 hardening)**  
> Monolito en `apps/client` con **Next.js + Prisma + PostgreSQL**, catálogo por perfil activo y reproducción local validada.  
> **Sin Directus ni Mux** como dependencias funcionales del producto Family V1.

SSOT oficial: `docs/family-v1/` (especialmente `00-SSOT.md` y `README.md` de esa carpeta).

---

## Stack activo Family V1

- App: `apps/client`
- DB: PostgreSQL (schema `family_v1`)
- ORM: Prisma
- Auth: cookies HTTP-only con JWT (`FAMILY_JWT_SECRET`)
- Media: upload local a disco y reproducción vía endpoint validado (`/api/family/media/[id]`)

## Estructura relevante

```text
apps/
  client/        ← App Family V1 (producto actual)
  api/           ← legado V2 (no fuente de verdad Family)
  cms/           ← legado V2 (no fuente de verdad Family)
docs/
  family-v1/     ← SSOT Family V1 (FASE 0..9)
```

## Variables de entorno (actuales)

Copiar `.env.example` a `.env` y ajustar:

- `DATABASE_URL`
- `FAMILY_JWT_SECRET`
- `FAMILY_STORAGE_ROOT`
- `LOG_LEVEL` (opcional)

Ejemplo local usado:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=homeflix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=Zaq1029*
DATABASE_URL=postgresql://postgres:Zaq1029%2A@localhost:5432/homeflix
FAMILY_JWT_SECRET=change-me-please-32-characters-minimum-v1
FAMILY_STORAGE_ROOT=public/storage
```

## Base de datos y migraciones Prisma

Comandos principales:

```bash
corepack pnpm install
corepack pnpm db:family:generate
corepack pnpm db:family:deploy
corepack pnpm --filter @homeflix/client typecheck
corepack pnpm --filter @homeflix/client build
```

Notas:

- Prisma migra sobre el schema `family_v1`.
- En pgAdmin revisa tablas en `homeflix > Schemas > family_v1 > Tables` (no en `public`).

## Seed de Family V1 (admin + perfiles)

Script: `apps/client/prisma/seed.ts`

Credenciales seed actuales:

- Email: `admin@family.local`
- Password: `familydev1`
- Role: `admin`
- Perfiles por defecto: `Principal`, `Niños`

Ejecución:

```bash
corepack pnpm --filter @homeflix/client exec tsx prisma/seed.ts
```

Si `DATABASE_URL` no está cargada en tu shell, ejecuta con variable explícita:

```powershell
$env:DATABASE_URL='postgresql://postgres:Zaq1029%2A@localhost:5432/homeflix'; corepack pnpm --filter @homeflix/client exec tsx prisma/seed.ts
```

## Puertos locales útiles

- App Next.js: `http://localhost:3000`
- PostgreSQL: `localhost:5432`

## Documentación recomendada

1. `docs/family-v1/README.md`
2. `docs/family-v1/03-DOMAIN_CONTRACTS.md`
3. `docs/family-v1/08-PHASE3-AUTH.md`
4. `docs/family-v1/11-PHASE6-LOCAL-PLAYBACK.md`
5. `docs/family-v1/13-PHASE8-CONTINUE-WATCHING.md`
6. `docs/family-v1/14-PHASE9-HARDENING.md`

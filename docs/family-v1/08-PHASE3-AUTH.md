# FASE 3 — auth básica, sesión y perfil activo

## Estrategia (simple)

- **Usuario**: cookie HTTP-only `hf_family_session` → JWT HS256 (`sub`, `email`, `role`).
- **Perfil activo**: cookie HTTP-only separada `hf_family_profile` → JWT (`sub` = `userId`, `pid` = `profileId`). Siempre validado en servidor contra Prisma (`profile.user_id === session.sub`).
- **Sin** tabla de sesiones en DB; **sin** localStorage como fuente de verdad de auth.
- **bcrypt** (`bcryptjs`) para `password_hash` en `family_v1.users`.
- Secreto: variable **`FAMILY_JWT_SECRET`** (≥ 32 caracteres), ver `getFamilyJwtSecretOrThrow()`.

## Rutas API (`/api/family/auth/*`)

| Método | Ruta | Efecto |
|--------|------|--------|
| POST | `/api/family/auth/login` | Valida credenciales, emite cookie de sesión, **borra** cookie de perfil (obliga re-selección tras login). |
| POST | `/api/family/auth/logout` | Limpia ambas cookies. |
| GET | `/api/family/auth/me` | Usuario actual, perfiles y perfil activo resuelto. |
| POST | `/api/family/auth/active-profile` | `{ profileId }` — perfil debe pertenecer al usuario. |
| DELETE | `/api/family/auth/active-profile` | Quita perfil activo. |

## Flujo UX

1. `/auth/login` — formulario Family.
2. Tras login con perfiles → `/auth/select-profile?next=…` (obligatorio elegir perfil).
3. Sin perfiles → `/auth/no-profiles`.
4. Storefront (`/`, `/search`, `/c/…`, `/profiles`) exige sesión + perfil activo (`requireStorefrontAccess` en layout).
5. Excepción: **`/login`** (token API legado) no exige sesión Family.
6. **`/admin`** exige rol `admin`; si no → `/auth/forbidden`.

## Catálogo

- `GET /api/family/catalog` — catálogo del **perfil activo** (cookies).
- `GET /api/family/catalog-preview` — requiere sesión; `profileId` en query solo si pertenece al usuario; si no, usa perfil activo.

## Seed demo

Desde `apps/client` con `DATABASE_URL` y migraciones aplicadas:

```bash
corepack pnpm --filter @homeflix/client exec prisma db seed
```

Por defecto: `admin@family.local` / `familydev1` (rol `admin`, dos perfiles si no existían).

## Middleware

- `src/middleware.ts` añade cabecera interna `x-pathname` para construir `next` en redirects de layouts.

## Próximo (FASE 4+)

- CRUD admin y gestión de `ProfileContentAccess` desde UI.
- End shims del catálogo legado Fastify cuando el catálogo Family cubra el producto.

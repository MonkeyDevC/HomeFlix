# Auditoría del repositorio (FASE 0)

## 1. Panorama actual

El repositorio **no está vacío**: corresponde a **HomeFlix “V2 / enterprise foundation”** (README raíz: FASE 8, arquitectura desacoplada).

### Carpetas y apps

| Ruta | Rol actual | Relación con Family V1 |
|------|------------|-------------------------|
| `apps/api` | Fastify, Prisma, Mux, webhooks, catálogo vía Prisma | **Legado V2**: backend separado; Family V1 lo **reemplaza** por lógica en Next (FASE 1+). |
| `apps/client` | Next.js App Router, storefront, `/dev` consola | **Base del monolito**: aquí vivirá el producto Family V1; partes dependen hoy de API externa y Mux. |
| `apps/cms` | Directus (Docker), bootstrap, IMPORT-RUNBOOK | **Legado V2**: **no** usado en Family V1; retirar de flujo mental y de compose en fase de migración. |
| `packages/contracts` | DTOs compartidos cliente/API | **Legado / transición**: contratos actuales asumen API+Mux; Family V1 necesitará contratos alineados a dominio local (FASE 1). |
| `packages/domain`, `packages/config` | Utilidades compartidas | **Revisar caso por caso** en FASE 1 (evitar arrastrar conceptos Mux/Directus). |
| `docker-compose.dev.yml` | Postgres, Directus, perfiles API/client | **Legado operativo**: Family V1 objetivo = **Postgres + app** (documentado; corte en `05-V2_DISPOSITION.md`). |
| `docs/phase-*`, `docs/architecture.md` | Fases 0–8 enterprise | **Referencia histórica**, no SSOT Family V1. |

### Dependencias representativas (V2)

- Cliente: `@mux/mux-player-react`, `@homeflix/contracts`, llamadas a API HTTP.
- API: `@mux/mux-node`, Prisma con `MediaAsset` y campos Mux, Fastify.

### Rutas Next relevantes

- `(storefront)/*`: consumo (catálogo, login, búsqueda) — **reutilizable como UX**; fuente de datos debe cambiar a monolito + reglas Family V1.
- `dev/*`: consola técnica enterprise — **no** parte de Family V1 producto; aislar o eliminar en fase posterior.
- No existía aún `(admin)` ni `/auth/*` dedicados Family V1: **añadidos en FASE 0** como cáscara mínima.

## 2. ¿Hay “base limpia” Family V1?

**No** antes de esta FASE 0: solo documentación dispersa orientada a V2. A partir de **`docs/family-v1/*`** existe **base documental SSOT** Family V1. El código productivo sigue siendo mayoritariamente V2 hasta migración explícita.

## 3. Reutilizable vs descartar vs deuda

| Reutilizable (con cambios en FASE 1+) | Descartar como eje de producto | Deuda si se arrastra sin plan |
|----------------------------------------|--------------------------------|-------------------------------|
| Next App Router, layouts, parte de UI storefront | Directus, Mux, consola `/dev` como “producto” | Mantener Fastify + Next duplicando reglas de catálogo |
| Idea de `Profile`, `ContentItem`, colecciones (dominio) | Webhooks Mux, signed playback enterprise | `contracts` con tipos Mux mezclados con Family V1 |
| PostgreSQL + Prisma (patrón de datos) | Pipeline upload externo | Dos fuentes de verdad editorial (CMS + DB) |

## 4. Conflictos con visión monolítica

- **Dos runtimes** (Next + Fastify) chocan con “un solo monolito”.
- **CMS externo** choca con “admin interno”.
- **Media externo** choca con “disco local”.
- **Dev Console** choca con “app familiar simple”.

## 5. Problemas detectados (sobreingeniería / operación)

- Separación cliente/API para un uso familiar en un VPS: coste operativo y de despliegue innecesarios para Family V1.
- Dependencia de Mux/Directus: complejidad y superficie de fallo no alineadas con el objetivo.
- Catálogo vía API sin regla explícita `ProfileContentAccess` en el modelo mental actual del cliente: riesgo de lógica implícita (Family V1 lo prohíbe).

## 6. SSOT Family V1

- **Este directorio `docs/family-v1/`**, en particular `00-SSOT.md` y `03-DOMAIN_CONTRACTS.md`.
- El README raíz debe enlazar aquí cuando se actualice el mensaje de proyecto (FASE 0 añade aviso).

## 7. Gaps explícitos (no implementados en FASE 0)

- Prisma aún no vive en `apps/client`; migración de esquema y datos.
- Auth completa, CRUD admin, uploads, player, despliegue VPS.
- Eliminación física de carpetas `apps/api`, `apps/cms` y dependencias Mux (riesgo de romper build hasta tener sustitutos).

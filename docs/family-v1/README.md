# HomeFlix Family V1 — documentación SSOT

Esta carpeta es la **fuente de verdad** arquitectónica y de dominio para **HomeFlix Family V1**. Cualquier texto en el repositorio que contradiga estos documentos para el alcance Family V1 debe considerarse **obsoleto** hasta alinearse.

| Documento | Contenido |
|------------|-----------|
| [00-SSOT.md](./00-SSOT.md) | Principios cerrados, stack, exclusiones (sin Directus, sin Mux). |
| [01-AUDIT.md](./01-AUDIT.md) | Auditoría del repo actual frente a Family V1. |
| [02-ARCHITECTURE.md](./02-ARCHITECTURE.md) | Monolito Next, capas, auth futura, almacenamiento local. |
| [03-DOMAIN_CONTRACTS.md](./03-DOMAIN_CONTRACTS.md) | Reglas explícitas de catálogo, perfiles, medios locales. |
| [04-UI_SHELLS.md](./04-UI_SHELLS.md) | Shells y componentes base previstos. |
| [05-V2_DISPOSITION.md](./05-V2_DISPOSITION.md) | Qué es legado V2, qué retirar en fases posteriores sin hibridar. |
| [06-PHASE1-TECH.md](./06-PHASE1-TECH.md) | Prisma en monolito, esquema `family_v1`, scripts y rutas internas (FASE 1). |
| [07-PHASE2-DOMAIN.md](./07-PHASE2-DOMAIN.md) | Dominio simplificado, catálogo por perfil, migración FASE 2. |
| [08-PHASE3-AUTH.md](./08-PHASE3-AUTH.md) | Login, sesión JWT en cookies, perfil activo, gates admin/storefront. |
| [09-PHASE4-ADMIN.md](./09-PHASE4-ADMIN.md) | Panel admin interno: CRUD catálogo, colecciones, contenido y acceso por perfil. |
| [10-PHASE5-LOCAL-MEDIA.md](./10-PHASE5-LOCAL-MEDIA.md) | Upload local de video/poster/thumbnail y registro de media en Prisma. |
| [11-PHASE6-LOCAL-PLAYBACK.md](./11-PHASE6-LOCAL-PLAYBACK.md) | Detalle reproducible con HTML5 video y validación de asset local por perfil. |
| [12-PHASE7-STOREFRONT.md](./12-PHASE7-STOREFRONT.md) | Home y búsqueda Family por perfil activo, filas por colección y sin base V2. |
| [13-PHASE8-CONTINUE-WATCHING.md](./13-PHASE8-CONTINUE-WATCHING.md) | Historial por perfil, reanudación de player y fila Continue Watching en Home. |
| [14-PHASE9-HARDENING.md](./14-PHASE9-HARDENING.md) | Hardening de access control, media proxy validado y errores consistentes. |

**FASE 0**: definición SSOT y cáscara. **FASE 1**: Prisma en `apps/client` y API `/api/family/*` mínima. **FASE 2**: dominio y catálogo por perfil. **FASE 3**: auth monolito y perfil activo explícito (`08-PHASE3-AUTH.md`). **FASE 4**: backoffice admin real (`09-PHASE4-ADMIN.md`). **FASE 5**: upload local de media en admin (`10-PHASE5-LOCAL-MEDIA.md`). **FASE 6**: detalle reproducible local (`11-PHASE6-LOCAL-PLAYBACK.md`). **FASE 7**: storefront Family por perfil activo (`12-PHASE7-STOREFRONT.md`). **FASE 8**: progreso/continue watching por perfil (`13-PHASE8-CONTINUE-WATCHING.md`). **FASE 9**: hardening de seguridad y consistencia (`14-PHASE9-HARDENING.md`). El API Fastify sigue en el repo como legado hasta migración explícita.

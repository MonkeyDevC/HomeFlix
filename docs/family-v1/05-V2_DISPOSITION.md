# Disposición del legado V2 (sin hibridar con Family V1)

## Principio

**Family V1 no convive como producto con la tripartita V2.** Hasta completar la migración, el código V2 permanece en el repo **marcado como legado** y la SSOT de producto nuevo es `docs/family-v1/`.

## Inventario “retirar o sustituir” (orden sugerido)

| Elemento | Acción |
|----------|--------|
| `apps/api` (Fastify) | Sustituir por route handlers + servicios en Next (FASE 1+). Luego **eliminar** carpeta. |
| `apps/cms` + Directus en compose | Dejar de usar; **eliminar** servicio compose y volúmenes asociados cuando no haya dependencia. |
| Dependencias `@mux/*` en client | Eliminar cuando el player use archivos locales. |
| `apps/client/src/app/dev/*` + `dev-console.css` | **Eliminar** o mover a repo aparte “homflix-lab”; no es Family V1. |
| `packages/contracts` con tipos Mux/API | Reemplazar por contratos Family V1 o capa delgada interna. |
| README raíz “tripartite” | Sustituir narrativa por Family V1 cuando el equipo declare migración completada. |

## Convivencia temporal

- **Storefront** puede seguir llamando a API Fastify **solo** mientras exista plan de borrado; debe documentarse como deuda (`01-AUDIT.md`).
- **`/login` en storefront** vs **`/auth/login`**: duplicación temporal; FASE 1 unifica a un solo flujo bajo `(auth)`.

## Prohibido

- “Híbrido” donde parte del catálogo viene de Directus y parte del monolito.
- Mantener Mux “solo para previews” en Family V1.

## Checklist antes de borrar `apps/api`

- [ ] Prisma y migraciones viven en el monolito.
- [ ] Auth y catálogo funcionan sin Fastify.
- [ ] Ningún script `pnpm` apunta a `apps/api`.
- [ ] CI actualizado.

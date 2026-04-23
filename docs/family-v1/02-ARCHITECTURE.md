# Arquitectura — Family V1 (objetivo)

## Monolito Next.js

- **Una** aplicación desplegable: `apps/client` (nombre de paquete puede renominarse en el futuro; el concepto es “una app”).
- **Backend** embebido: Route Handlers (`app/api/...`), **Server Actions** para mutaciones, y una **carpeta de servicios** (p. ej. `src/server/services/`) sin framework HTTP aparte.
- **Validación**: Zod (o similar) en capa de servicio; errores mapeados a respuestas HTTP coherentes.
- **Contratos**: tipos compartidos en módulo interno o paquete `packages/family-contracts` **cuando** se retire el acoplamiento a `packages/contracts` V2.

## Datos

- **Prisma** como única capa de acceso a PostgreSQL desde el monolito.
- Migraciones versionadas en el repo del monolito (tras mover schema desde `apps/api`).

## Auth (futura, FASE 1+)

- Sesión propia (cookie + JWT firmado en servidor o sesión DB) **sin** depender de Directus.
- Roles mínimos: al menos `admin` vs `miembro` / `viewer` según decisión de producto.
- Rutas `/auth/*` para login/logout; `/admin/*` protegido.

## Almacenamiento

- Directorio configurable (`LOCAL_MEDIA_ROOT` o similar) **fuera** de `public/` o servido de forma controlada con auth.
- Thumbnails/posters como archivos locales; metadatos en `MediaAsset` (path relativo, mime, duración).

## Capas lógicas

```
app/(storefront)   → consumo, catálogo por perfil
app/(admin)        → panel interno
app/(auth)         → login / recuperación mínima
app/api            → API interna (JSON) si hace falta para cliente o integraciones
src/server/services → reglas de dominio (catálogo, accesos, media)
```

## Anti-patrón

- Volver a introducir un segundo servidor “oficial” para el mismo producto.
- Depender de webhooks externos para el flujo principal de video familiar.

# FASE 7 — Storefront Family por perfil activo

## Objetivo

Convertir el storefront en flujo Family V1 puro:

- home filtrado por perfil activo
- filas por colección
- búsqueda básica filtrada por perfil
- detalle de FASE 6 integrado
- sin dependencia funcional de contratos/API legacy V2

## Contratos Family

- `FamilyContentCardDto`
- `FamilyHomeRowDto`
- `FamilyHomeDto`
- `FamilySearchResultDto`

Archivo: `apps/client/src/lib/family/storefront-contracts.ts`.

## Consultas server-side

Archivo: `apps/client/src/lib/server/catalog/storefront-home-search.ts`.

- `getFamilyHomeForProfile(activeProfile)`:
  - solo ítems `published`
  - solo ítems con fila `ProfileContentAccess` del perfil activo
  - rows por colección
  - colecciones vacías ocultas
- `searchFamilyCatalogForProfile(profileId, query)`:
  - misma regla de visibilidad
  - búsqueda básica `title|slug|synopsis` (contains, insensitive)

## Storefront UI

- Home y Search renderizados server-side en `(storefront)`.
- Navegación simple de consumo (`Inicio`, `Buscar`, `Perfiles`, badge de perfil activo).
- Estados vacíos y error claros para catálogo y búsqueda.

## APIs Family técnicas

- `GET /api/family/home`
- `GET /api/family/search?q=...`

Resuelven sesión y perfil activo en servidor.

## Fuera de alcance

Continue watching final, recomendaciones, analytics, búsqueda avanzada full-text.


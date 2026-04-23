# Contratos de dominio — Family V1

Todo lo siguiente es **explícito**. No hay visibilidad implícita de catálogo.

## Entidades (modelo mental)

| Entidad | Responsabilidad |
|---------|------------------|
| `User` | Cuenta humana que inicia sesión. |
| `Profile` | Unidad de **acceso al catálogo** (ej. adulto, niño). Un usuario puede tener varios perfiles. |
| `ContentItem` | Pieza editorial: título, slug, estado editorial, etc. |
| `MediaAsset` | **Archivo local** (`file_path`, MIME, duración/tamaño opcional, `status`). Opcionalmente ligado a un `ContentItem` vía `content_item_id`. **Sin** campos de proveedor externo (p. ej. Mux). |
| `Category` / `Collection` | Organización editorial: **`Category`** define un carrusel en el home y tiene `release_scope` (`admin_only` \| `public_catalog`). Colecciones vía enlace. |
| `ContentItemCollectionLink` | Membresía ordenada ítem ↔ colección (`position` siempre definida). |
| `WatchHistory` | Progreso por perfil + ítem (y opcionalmente asset). |
| `ProfileContentAccess` | **Regla explícita**: fila `(profileId, contentItemId)` = ese perfil **puede** ver ese ítem en storefront (además de publicación). |

## Visibilidad en storefront

Un `ContentItem` en el catálogo familiar (perfiles espectador) **solo** se lista o se muestra si **simultáneamente**:

1. `editorialStatus === "published"`.
2. `releaseScope === "public_catalog"` (alcance de lanzamiento explícito; independiente del estado editorial).
3. Existe una fila `ProfileContentAccess` con el `profileId` **activo** en sesión y ese `contentItemId`.

Los administradores pueden además ver ítems con `releaseScope === "admin_only"` (vista previa interna) cuando su perfil activo tiene fila de acceso, sin exigir publicación.

**No** hay fallback del tipo “si no hay reglas, mostrar todo”. Si no hay fila de acceso, **no** visible.

### Carruseles (`Category`) en el home

- Espectador: solo categorías con `releaseScope === "public_catalog"`.
- Admin: ve también categorías `admin_only` (mismo home como vista previa).
- Una fila de carrusel solo se envía al cliente si, tras filtrar por categoría **y** por las reglas de `ContentItem` anteriores, queda al menos un ítem visible (no se envían filas vacías).

## Admin

- Crea/edita `ContentItem`, categorías, colecciones, enlaces, **asignaciones** `ProfileContentAccess`, y metadatos de `MediaAsset` asociados a archivos locales.
- **No** administra webhooks Mux ni estado de proveedor externo.

## Storefront

- Solo consume datos ya filtrados por las reglas anteriores (contenido y carruseles).
- **Nunca** debe recibir del servidor ítems sin pasar la comprobación de perfil + reglas de alcance.

## Shapes TypeScript (monolito)

Implementación viva: `apps/client/src/lib/family/domain-shapes.ts` (lectura / contratos), reglas centrales `content-storefront-visibility.ts` y `category-storefront-visibility.ts`, y listado: `catalog-for-profile.ts` (`listPublishedCatalogForProfile`).

## API interna (validación técnica)

- `GET /api/family/catalog-preview?profileId=<uuid>` — lista ítems que cumplen **publicado + `ProfileContentAccess`** (sin auth de producto todavía; solo comprobación de dominio).
- Cualquier listado de producto **debe** reutilizar la misma regla en servidor (no duplicar semántica en el cliente).

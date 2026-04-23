# Contratos de dominio — Family V1

Todo lo siguiente es **explícito**. No hay visibilidad implícita de catálogo.

## Entidades (modelo mental)

| Entidad | Responsabilidad |
|---------|------------------|
| `User` | Cuenta humana que inicia sesión. |
| `Profile` | Unidad de **acceso al catálogo** (ej. adulto, niño). Un usuario puede tener varios perfiles. |
| `ContentItem` | Pieza editorial: título, slug, estado editorial, etc. |
| `MediaAsset` | **Archivo local** (`file_path`, MIME, duración/tamaño opcional, `status`). Opcionalmente ligado a un `ContentItem` vía `content_item_id`. **Sin** campos de proveedor externo (p. ej. Mux). |
| `Category` / `Collection` | Organización editorial (categoría opcional por ítem; colecciones vía enlace). |
| `ContentItemCollectionLink` | Membresía ordenada ítem ↔ colección (`position` siempre definida). |
| `WatchHistory` | Progreso por perfil + ítem (y opcionalmente asset). |
| `ProfileContentAccess` | **Regla explícita**: fila `(profileId, contentItemId)` = ese perfil **puede** ver ese ítem en storefront (además de publicación). |

## Visibilidad en storefront

Un `ContentItem` **solo** se lista o se muestra si **simultáneamente**:

1. `editorialStatus === "published"` (o nombre equivalente cerrado en esquema Prisma).
2. Existe una fila `ProfileContentAccess` con el `profileId` **activo** en sesión y ese `contentItemId`.

**No** hay fallback del tipo “si no hay reglas, mostrar todo”. Si no hay fila de acceso, **no** visible.

## Admin

- Crea/edita `ContentItem`, categorías, colecciones, enlaces, **asignaciones** `ProfileContentAccess`, y metadatos de `MediaAsset` asociados a archivos locales.
- **No** administra webhooks Mux ni estado de proveedor externo.

## Storefront

- Solo consume datos ya filtrados por las reglas anteriores.
- **Nunca** debe recibir del servidor ítems sin pasar la comprobación de perfil + publicado.

## Shapes TypeScript (monolito)

Implementación viva: `apps/client/src/lib/family/domain-shapes.ts` (lectura / contratos) y consulta de catálogo: `apps/client/src/lib/server/catalog/catalog-for-profile.ts` (`listPublishedCatalogForProfile`).

## API interna (validación técnica)

- `GET /api/family/catalog-preview?profileId=<uuid>` — lista ítems que cumplen **publicado + `ProfileContentAccess`** (sin auth de producto todavía; solo comprobación de dominio).
- Cualquier listado de producto **debe** reutilizar la misma regla en servidor (no duplicar semántica en el cliente).

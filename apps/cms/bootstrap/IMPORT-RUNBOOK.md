# Runbook: importar el modelo editorial en Directus 11 (Studio)

Prerrequisitos: PostgreSQL con migraciones Prisma aplicadas (`pnpm db:migrate`) y contenedor Directus en marcha (`pnpm dev:infra` o `pnpm dev:cms`).

## 1. Acceder a Studio

- URL: `http://localhost:8055` (o `CMS_PUBLIC_URL`).
- Inicia sesión con `DIRECTUS_ADMIN_EMAIL` / `DIRECTUS_ADMIN_PASSWORD` (ver `.env.example`).

## 2. Importar tablas existentes (orden recomendado)

En **Settings → Data Model → Create collection → Import from database** (o el asistente equivalente en tu build de Directus 11), importa **en este orden** para respetar FKs al configurar relaciones:

1. **`categories`** — CRUD editorial de categorías.
2. **`collections`** — CRUD editorial de colecciones.
3. **`content_items`** — piezas editoriales (`editorial_status`, `visibility`, `slug`, `title`, etc.).
4. **`content_item_collection_links`** — membresía en colección + `position` (orden tienda futura). La tabla tiene **`id` UUID** como clave primaria y unicidad en `(content_item_id, collection_id)` para que Directus Studio muestre campos al importar; si creaste la colección antes de aplicar migraciones, **bórrala en Data Model** y vuelve a **Import from database** tras `pnpm db:migrate` / `pnpm db:deploy`.
5. **`media_assets`** — **antes** que los enlaces a media: la FK de `content_item_media_asset_links` apunta aquí. **Solo** selección/lectura en Studio para enlazar ítems; no sustituyas el pipeline Mux (lo gobiernan la API y Mux).
6. **`content_item_media_asset_links`** — **única relación oficial** ítem ↔ `media_assets` con `role` (`primary` \| `trailer` \| `teaser`).

### Checklist si ya tienes `categories` y `collections` (siguiente bloque)

No hace falta borrar lo ya importado. Sigue **solo** con las tablas que falten, en este orden:

| Orden | Tabla | Qué comprobar tras importar |
|------|--------|-----------------------------|
| 3 | `content_items` | PK en `id` (UUID). Relaciones opcionales hacia `categories` / `collections` / `media_assets` si Studio las detectó. |
| 4 | `content_item_collection_links` | PK en `id` (UUID). FKs a `content_items` y `collections`. Si la colección quedó vacía o rara, bórrala en Data Model y reimporta tras `pnpm db:deploy`. |
| 5 | `media_assets` | Importar **antes** de `content_item_media_asset_links`. Uso en Studio: referencia técnica al enlazar; no edites el ciclo Mux aquí. |
| 6 | `content_item_media_asset_links` | PK en `id`. FKs a `content_items` y `media_assets`. |

Luego pasa a **§3 Ajustes de interfaz** (dropdowns en `content_items` y `role` en enlaces a media), **§4** publicación, **§6** `pnpm cms:verify`, y opcionalmente **§5** snapshot.

## 3. Ajustes de interfaz sugeridos (mínimos)

### `content_items`

- `editorial_status`: interfaz **Dropdown** con opciones fijas: `draft`, `published`, `archived`.
- `visibility`: **Dropdown** con `private`, `household`, `public-internal`.
- `type`: **Dropdown** con `movie`, `clip`, `episode`.
- `primary_media_asset_id`: mostrar como relación M2O hacia `media_assets` **solo como puntero denormalizado**. Tras cambiar el vínculo `primary` en `content_item_media_asset_links`, actualiza este campo para mantener coherencia con la API endurecida (o automatiza en FASE 5 con flujo).

### `content_item_media_asset_links`

- `role`: dropdown `primary`, `trailer`, `teaser`.
- Relaciones a `content_items` y `media_assets`.

#### Error: `invalid input syntax for type uuid` al crear un enlace

En Postgres, **`content_item_id`** y **`media_asset_id`** son tipo **UUID** (la PK de `content_items` y `media_assets`). Un valor como `eiOpLNFY6cYzkMlZVE3n00hmYMpz1P402DQVmv78kGhRs` **no es UUID**: suele ser un **ID de Mux** (`provider_upload_id`, `playback_id`, etc.) o texto pegado por error.

**Qué hacer en Directus**

1. Abre **Data Model → `content_item_media_asset_links`** y revisa **`media_asset_id`** y **`content_item_id`**: deben ser relación **M2O** hacia `media_assets` / `content_items` usando su campo **`id`** (tipo UUID en base), no otra columna.
2. Al crear el ítem, elige el media asset y el content item **desde el desplegable de la relación** (así Directus envía el UUID de `id`). No pegues IDs de Mux en esos campos.
3. Si la relación se creó mal al importar, **elimina el campo** y vuelve a crear **M2O** manualmente hacia la colección correcta, campo relacionado **`id`**.

**Comprobar en SQL** (misma base que Directus):

```sql
SELECT id, provider_upload_id, playback_id FROM media_assets LIMIT 5;
SELECT id, slug FROM content_items LIMIT 5;
```

El UUID de `id` tiene forma `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

## 4. Publicación básica

- Trabajar en `draft`, pasar a `published` cuando el contenido esté listo; `archived` para retirarlo sin borrar filas.
- **No** uses el estado técnico de `media_assets` para decidir publicación editorial.

## 5. Congelar el modelo (opcional, reproducible)

Cuando el import quede validado en un entorno de referencia:

```bash
docker compose -f docker-compose.dev.yml exec directus \
  npx directus schema snapshot /directus/snapshot/editorial-baseline.yaml --format yaml --yes
```

El archivo resultante puede versionarse (ver `apps/cms/snapshot/README.md`). Aplicación en otros entornos:

```bash
docker compose -f docker-compose.dev.yml exec directus \
  npx directus schema apply /directus/snapshot/editorial-baseline.yaml --yes
```

## 6. Verificación automatizada

Desde la raíz del monorepo, con Directus accesible:

```bash
corepack pnpm cms:verify
```

Comprueba login de administrador y lectura vía API de ítems de las colecciones editoriales clave.

## 7. Si `pnpm db:deploy` falló en `content_item_collection_links_id` (P3018)

La migración del `id` en la tabla de enlaces es **idempotente** en el repo (tolerar `id` UUID ya creada, sustituir una `id` INTEGER errónea, o **recrear la tabla** si faltan `content_item_id` / `collection_id` — típico tras un `CASCADE` o una colección creada solo en Studio; **se pierden filas** de esa tabla de enlace). Si Prisma quedó en estado **fallido** y no vuelve a aplicar sola:

```bash
corepack pnpm --filter @homeflix/api exec prisma migrate resolve --rolled-back 20260422140000_content_item_collection_links_id
corepack pnpm db:deploy
```

En PowerShell el script del monorepo hay que invocarlo con **`corepack pnpm db:deploy`** (no basta escribir `db:deploy` solo).

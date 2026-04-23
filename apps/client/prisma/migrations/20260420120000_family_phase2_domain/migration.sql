-- FASE 2 — dominio Family V1 simplificado: catálogo por perfil explícito, MediaAsset local, sin tabla puente de media.

-- 1. Watch history: quitar referencia opcional a media
ALTER TABLE "family_v1"."watch_history" DROP CONSTRAINT IF EXISTS "watch_history_media_asset_id_fkey";
ALTER TABLE "family_v1"."watch_history" DROP COLUMN IF EXISTS "media_asset_id";

-- 2. Tabla puente ítem ↔ media (sustituida por media_assets.content_item_id)
DROP TABLE IF EXISTS "family_v1"."content_item_media_asset_links";

-- 3. Content items: quitar atajos legacy y published_at; renombrar categoría a category_id
ALTER TABLE "family_v1"."content_items" DROP CONSTRAINT IF EXISTS "content_items_primary_media_asset_id_fkey";
ALTER TABLE "family_v1"."content_items" DROP CONSTRAINT IF EXISTS "content_items_primary_collection_id_fkey";
ALTER TABLE "family_v1"."content_items" DROP CONSTRAINT IF EXISTS "content_items_primary_category_id_fkey";
ALTER TABLE "family_v1"."content_items" DROP COLUMN IF EXISTS "primary_media_asset_id";
ALTER TABLE "family_v1"."content_items" DROP COLUMN IF EXISTS "primary_collection_id";
ALTER TABLE "family_v1"."content_items" DROP COLUMN IF EXISTS "published_at";

ALTER TABLE "family_v1"."content_items" RENAME COLUMN "primary_category_id" TO "category_id";
ALTER TABLE "family_v1"."content_items" ADD CONSTRAINT "content_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "family_v1"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "family_v1"."content_items" ADD COLUMN "thumbnail_path" TEXT;
ALTER TABLE "family_v1"."content_items" ADD COLUMN "poster_path" TEXT;

CREATE INDEX "content_items_category_id_idx" ON "family_v1"."content_items"("category_id");

-- 4. Media assets: path único, pertenencia opcional al ítem, estado y tamaño
ALTER TABLE "family_v1"."media_assets" RENAME COLUMN "relative_path" TO "file_path";
ALTER TABLE "family_v1"."media_assets" ADD COLUMN "content_item_id" UUID;
ALTER TABLE "family_v1"."media_assets" ADD COLUMN "size_bytes" BIGINT;
ALTER TABLE "family_v1"."media_assets" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "family_v1"."media_assets" ADD CONSTRAINT "media_assets_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "media_assets_content_item_id_idx" ON "family_v1"."media_assets"("content_item_id");

-- 5. Categories: modelo mínimo (sin descripción)
ALTER TABLE "family_v1"."categories" DROP COLUMN IF EXISTS "description";

-- 6. Profiles: usuario obligatorio, avatar opcional, sin family_safe
DELETE FROM "family_v1"."profile_content_access" WHERE "profile_id" IN (SELECT "id" FROM "family_v1"."profiles" WHERE "user_id" IS NULL);
DELETE FROM "family_v1"."watch_history" WHERE "profile_id" IN (SELECT "id" FROM "family_v1"."profiles" WHERE "user_id" IS NULL);
DELETE FROM "family_v1"."profiles" WHERE "user_id" IS NULL;

ALTER TABLE "family_v1"."profiles" DROP CONSTRAINT IF EXISTS "profiles_user_id_fkey";
ALTER TABLE "family_v1"."profiles" DROP COLUMN IF EXISTS "family_safe";
ALTER TABLE "family_v1"."profiles" ADD COLUMN "avatar_key" TEXT;
ALTER TABLE "family_v1"."profiles" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "family_v1"."profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "family_v1"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Roles de usuario
UPDATE "family_v1"."users" SET "role" = 'family_viewer' WHERE "role" = 'member';
UPDATE "family_v1"."users" SET "role" = 'family_viewer' WHERE "role" NOT IN ('admin', 'family_viewer');
ALTER TABLE "family_v1"."users" ALTER COLUMN "role" SET DEFAULT 'family_viewer';

-- 8. Enlaces colección: posición siempre definida
UPDATE "family_v1"."content_item_collection_links" SET "position" = 0 WHERE "position" IS NULL;
ALTER TABLE "family_v1"."content_item_collection_links" ALTER COLUMN "position" SET DEFAULT 0;
ALTER TABLE "family_v1"."content_item_collection_links" ALTER COLUMN "position" SET NOT NULL;

-- 9. Índice para consultas de catálogo por perfil
CREATE INDEX "profile_content_access_profile_id_idx" ON "family_v1"."profile_content_access"("profile_id");

CREATE TABLE "categories" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "collections" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "content_items" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "synopsis" TEXT,
  "type" TEXT NOT NULL DEFAULT 'movie',
  "editorial_status" TEXT NOT NULL DEFAULT 'draft',
  "visibility" TEXT NOT NULL DEFAULT 'private',
  "primary_media_asset_id" UUID,
  "primary_category_id" UUID REFERENCES "categories"("id") ON DELETE SET NULL,
  "primary_collection_id" UUID REFERENCES "collections"("id") ON DELETE SET NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMP(3)
);

CREATE INDEX "content_items_editorial_status_idx" ON "content_items"("editorial_status");
CREATE INDEX "content_items_primary_category_id_idx" ON "content_items"("primary_category_id");
CREATE INDEX "content_items_primary_collection_id_idx" ON "content_items"("primary_collection_id");
CREATE INDEX "content_items_primary_media_asset_id_idx" ON "content_items"("primary_media_asset_id");
CREATE INDEX "content_items_type_idx" ON "content_items"("type");

CREATE TABLE "content_item_collection_links" (
  "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "collection_id" UUID NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
  "position" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("content_item_id", "collection_id")
);

CREATE INDEX "content_item_collection_links_collection_id_position_idx"
  ON "content_item_collection_links"("collection_id", "position");

CREATE TABLE "content_item_media_asset_links" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "media_asset_id" UUID NOT NULL REFERENCES "media_assets"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL DEFAULT 'primary',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "content_item_media_asset_links_content_media_role_key"
    UNIQUE ("content_item_id", "media_asset_id", "role")
);

CREATE INDEX "content_item_media_asset_links_content_item_id_role_idx"
  ON "content_item_media_asset_links"("content_item_id", "role");

CREATE INDEX "content_item_media_asset_links_media_asset_id_idx"
  ON "content_item_media_asset_links"("media_asset_id");

CREATE TABLE "profiles" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "display_name" TEXT NOT NULL,
  "avatar_key" TEXT,
  "family_safe" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "watch_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" UUID NOT NULL REFERENCES "profiles"("id") ON DELETE CASCADE,
  "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
  "media_asset_id" UUID REFERENCES "media_assets"("id") ON DELETE SET NULL,
  "progress_seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completed_at" TIMESTAMP(3),
  "last_watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "watch_history_profile_content_key"
    UNIQUE ("profile_id", "content_item_id")
);

CREATE INDEX "watch_history_profile_id_last_watched_at_idx"
  ON "watch_history"("profile_id", "last_watched_at");

CREATE INDEX "watch_history_content_item_id_idx" ON "watch_history"("content_item_id");
CREATE INDEX "watch_history_media_asset_id_idx" ON "watch_history"("media_asset_id");

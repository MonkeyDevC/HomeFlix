-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "family_v1";

-- CreateTable
CREATE TABLE "family_v1"."users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."profiles" (
    "id" UUID NOT NULL,
    "display_name" TEXT NOT NULL,
    "family_safe" BOOLEAN NOT NULL DEFAULT false,
    "user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."categories" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."collections" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."content_items" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "synopsis" TEXT,
    "type" TEXT NOT NULL DEFAULT 'movie',
    "editorial_status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "primary_media_asset_id" UUID,
    "primary_category_id" UUID,
    "primary_collection_id" UUID,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."media_assets" (
    "id" UUID NOT NULL,
    "relative_path" TEXT NOT NULL,
    "mime_type" TEXT,
    "duration_seconds" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."content_item_collection_links" (
    "id" UUID NOT NULL,
    "content_item_id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "position" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_item_collection_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."content_item_media_asset_links" (
    "id" UUID NOT NULL,
    "content_item_id" UUID NOT NULL,
    "media_asset_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_item_media_asset_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."profile_content_access" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "content_item_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_content_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_v1"."watch_history" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "content_item_id" UUID NOT NULL,
    "media_asset_id" UUID,
    "progress_seconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "last_watched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "watch_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "family_v1"."users"("email");

-- CreateIndex
CREATE INDEX "profiles_user_id_idx" ON "family_v1"."profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "family_v1"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "collections_slug_key" ON "family_v1"."collections"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "content_items_slug_key" ON "family_v1"."content_items"("slug");

-- CreateIndex
CREATE INDEX "content_items_editorial_status_idx" ON "family_v1"."content_items"("editorial_status");

-- CreateIndex
CREATE INDEX "content_item_collection_links_collection_id_position_idx" ON "family_v1"."content_item_collection_links"("collection_id", "position");

-- CreateIndex
CREATE UNIQUE INDEX "content_item_collection_links_content_item_id_collection_id_key" ON "family_v1"."content_item_collection_links"("content_item_id", "collection_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_item_media_asset_links_content_item_id_media_asset__key" ON "family_v1"."content_item_media_asset_links"("content_item_id", "media_asset_id", "role");

-- CreateIndex
CREATE INDEX "profile_content_access_content_item_id_idx" ON "family_v1"."profile_content_access"("content_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_content_access_profile_id_content_item_id_key" ON "family_v1"."profile_content_access"("profile_id", "content_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "watch_history_profile_id_content_item_id_key" ON "family_v1"."watch_history"("profile_id", "content_item_id");

-- AddForeignKey
ALTER TABLE "family_v1"."profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "family_v1"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_items" ADD CONSTRAINT "content_items_primary_category_id_fkey" FOREIGN KEY ("primary_category_id") REFERENCES "family_v1"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_items" ADD CONSTRAINT "content_items_primary_collection_id_fkey" FOREIGN KEY ("primary_collection_id") REFERENCES "family_v1"."collections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_items" ADD CONSTRAINT "content_items_primary_media_asset_id_fkey" FOREIGN KEY ("primary_media_asset_id") REFERENCES "family_v1"."media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_item_collection_links" ADD CONSTRAINT "content_item_collection_links_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_item_collection_links" ADD CONSTRAINT "content_item_collection_links_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "family_v1"."collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_item_media_asset_links" ADD CONSTRAINT "content_item_media_asset_links_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."content_item_media_asset_links" ADD CONSTRAINT "content_item_media_asset_links_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "family_v1"."media_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."profile_content_access" ADD CONSTRAINT "profile_content_access_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "family_v1"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."profile_content_access" ADD CONSTRAINT "profile_content_access_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."watch_history" ADD CONSTRAINT "watch_history_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "family_v1"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."watch_history" ADD CONSTRAINT "watch_history_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."watch_history" ADD CONSTRAINT "watch_history_media_asset_id_fkey" FOREIGN KEY ("media_asset_id") REFERENCES "family_v1"."media_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

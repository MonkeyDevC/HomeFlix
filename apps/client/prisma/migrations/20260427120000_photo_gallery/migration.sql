-- CreateTable
CREATE TABLE "family_v1"."photo_assets" (
    "id" UUID NOT NULL,
    "content_item_id" UUID NOT NULL,
    "file_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "alt_text" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photo_assets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "photo_assets_content_item_id_idx" ON "family_v1"."photo_assets"("content_item_id");

-- AddForeignKey
ALTER TABLE "family_v1"."photo_assets" ADD CONSTRAINT "photo_assets_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "family_v1"."content_items" ADD COLUMN "cover_photo_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "content_items_cover_photo_id_key" ON "family_v1"."content_items"("cover_photo_id");

-- AddForeignKey
ALTER TABLE "family_v1"."content_items" ADD CONSTRAINT "content_items_cover_photo_id_fkey" FOREIGN KEY ("cover_photo_id") REFERENCES "family_v1"."photo_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

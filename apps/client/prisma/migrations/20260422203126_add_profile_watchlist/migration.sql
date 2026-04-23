-- CreateTable
CREATE TABLE "family_v1"."profile_watchlist_items" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "content_item_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profile_watchlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profile_watchlist_items_profile_id_idx" ON "family_v1"."profile_watchlist_items"("profile_id");

-- CreateIndex
CREATE INDEX "profile_watchlist_items_content_item_id_idx" ON "family_v1"."profile_watchlist_items"("content_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_watchlist_items_profile_id_content_item_id_key" ON "family_v1"."profile_watchlist_items"("profile_id", "content_item_id");

-- AddForeignKey
ALTER TABLE "family_v1"."profile_watchlist_items" ADD CONSTRAINT "profile_watchlist_items_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "family_v1"."profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "family_v1"."profile_watchlist_items" ADD CONSTRAINT "profile_watchlist_items_content_item_id_fkey" FOREIGN KEY ("content_item_id") REFERENCES "family_v1"."content_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

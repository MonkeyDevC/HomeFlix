-- Enforce at most one primary ContentItemMediaAssetLink per content item.
-- Keeps the newest primary row when duplicates exist from earlier phases.

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY content_item_id
           ORDER BY created_at DESC, id
         ) AS rn
  FROM content_item_media_asset_links
  WHERE role = 'primary'
)
DELETE FROM content_item_media_asset_links l
WHERE l.id IN (SELECT id FROM ranked WHERE rn > 1);

CREATE UNIQUE INDEX IF NOT EXISTS "content_item_media_asset_links_primary_per_item_uidx"
  ON "content_item_media_asset_links" ("content_item_id")
  WHERE ("role" = 'primary');

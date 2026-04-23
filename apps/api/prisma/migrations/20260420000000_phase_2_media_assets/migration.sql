CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "media_assets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "provider" TEXT NOT NULL DEFAULT 'mux',
  "provider_asset_id" TEXT,
  "provider_upload_id" TEXT,
  "provider_playback_id" TEXT,
  "content_item_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "playback_policy" TEXT NOT NULL DEFAULT 'public',
  "source_filename" TEXT,
  "mime_type" TEXT,
  "duration_seconds" DOUBLE PRECISION,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ready_at" TIMESTAMP(3),
  "failed_at" TIMESTAMP(3),
  "failure_reason" TEXT,
  "raw_webhook_last_event_type" TEXT,
  "raw_webhook_last_event_at" TIMESTAMP(3),

  CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "media_assets_provider_upload_id_key"
  ON "media_assets"("provider_upload_id");

CREATE INDEX IF NOT EXISTS "media_assets_content_item_id_idx"
  ON "media_assets"("content_item_id");

CREATE INDEX IF NOT EXISTS "media_assets_provider_asset_id_idx"
  ON "media_assets"("provider_asset_id");

CREATE INDEX IF NOT EXISTS "media_assets_status_idx"
  ON "media_assets"("status");

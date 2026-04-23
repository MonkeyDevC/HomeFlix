ALTER TABLE "media_assets"
  ADD COLUMN "playback_id" TEXT,
  ADD COLUMN "last_webhook_event_id" TEXT;

CREATE INDEX "media_assets_last_webhook_event_id_idx"
  ON "media_assets"("last_webhook_event_id");

CREATE TABLE "media_asset_webhook_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "provider" TEXT NOT NULL DEFAULT 'mux',
  "provider_event_id" TEXT NOT NULL UNIQUE,
  "event_type" TEXT NOT NULL,
  "media_asset_id" UUID,
  "applied" BOOLEAN NOT NULL DEFAULT FALSE,
  "transition" TEXT,
  "reason" TEXT,
  "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMP(3)
);

CREATE INDEX "media_asset_webhook_events_media_asset_id_idx"
  ON "media_asset_webhook_events"("media_asset_id");

CREATE INDEX "media_asset_webhook_events_event_type_idx"
  ON "media_asset_webhook_events"("event_type");

-- Añade metadatos de calidad de video a media_assets (Family V1).
-- Se usan columnas NULLables para no romper registros previos.

ALTER TABLE "family_v1"."media_assets"
  ADD COLUMN IF NOT EXISTS "width"      INTEGER,
  ADD COLUMN IF NOT EXISTS "height"     INTEGER,
  ADD COLUMN IF NOT EXISTS "frame_rate" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "codec"      TEXT;

-- Metadatos editoriales adicionales en content_items (Family V1).
-- Todos NULLables para no romper filas existentes.

ALTER TABLE "family_v1"."content_items"
  ADD COLUMN IF NOT EXISTS "release_year"     INTEGER,
  ADD COLUMN IF NOT EXISTS "maturity_rating"  TEXT,
  ADD COLUMN IF NOT EXISTS "season_number"    INTEGER,
  ADD COLUMN IF NOT EXISTS "episode_number"   INTEGER;

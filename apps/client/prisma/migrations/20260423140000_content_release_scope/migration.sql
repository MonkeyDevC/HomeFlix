-- Alcance de lanzamiento storefront (independiente del estado editorial).

ALTER TABLE "family_v1"."content_items" ADD COLUMN "release_scope" TEXT NOT NULL DEFAULT 'public_catalog';

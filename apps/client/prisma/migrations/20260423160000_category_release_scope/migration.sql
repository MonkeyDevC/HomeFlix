-- Alcance de lanzamiento para carruseles (categorías) en storefront.

ALTER TABLE "family_v1"."categories" ADD COLUMN "release_scope" TEXT NOT NULL DEFAULT 'public_catalog';

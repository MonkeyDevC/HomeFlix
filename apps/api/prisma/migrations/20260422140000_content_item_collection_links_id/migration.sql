-- Surrogate PK UUID + UNIQUE(content_item_id, collection_id) para Directus y Prisma.
-- Cubre: tabla Prisma con PK compuesta, tabla ya migrada a UUID, `id` INTEGER errónea,
-- o tabla vacía / rota sin columnas FK (p. ej. tras CASCADE desde Directus).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'content_item_collection_links'
  ) THEN
    CREATE TABLE "content_item_collection_links" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
      "collection_id" UUID NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
      "position" INTEGER,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "content_item_collection_links_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "content_item_collection_links_content_item_id_collection_id_key"
        UNIQUE ("content_item_id", "collection_id")
    );

    CREATE INDEX IF NOT EXISTS "content_item_collection_links_collection_id_position_idx"
      ON "content_item_collection_links" ("collection_id", "position");
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_item_collection_links'
      AND column_name = 'content_item_id'
  )
  OR NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'content_item_collection_links'
      AND column_name = 'collection_id'
  ) THEN
    DROP TABLE IF EXISTS "content_item_collection_links" CASCADE;

    CREATE TABLE "content_item_collection_links" (
      "id" UUID NOT NULL DEFAULT gen_random_uuid(),
      "content_item_id" UUID NOT NULL REFERENCES "content_items"("id") ON DELETE CASCADE,
      "collection_id" UUID NOT NULL REFERENCES "collections"("id") ON DELETE CASCADE,
      "position" INTEGER,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "content_item_collection_links_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "content_item_collection_links_content_item_id_collection_id_key"
        UNIQUE ("content_item_id", "collection_id")
    );

    CREATE INDEX IF NOT EXISTS "content_item_collection_links_collection_id_position_idx"
      ON "content_item_collection_links" ("collection_id", "position");
  ELSE
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'content_item_collection_links'
        AND column_name = 'id'
        AND data_type <> 'uuid'
    ) THEN
      ALTER TABLE "content_item_collection_links" DROP COLUMN "id" CASCADE;
    END IF;

    ALTER TABLE "content_item_collection_links" ADD COLUMN IF NOT EXISTS "id" UUID;

    UPDATE "content_item_collection_links" SET "id" = gen_random_uuid() WHERE "id" IS NULL;

    ALTER TABLE "content_item_collection_links" ALTER COLUMN "id" SET NOT NULL;
    ALTER TABLE "content_item_collection_links" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

    ALTER TABLE "content_item_collection_links" DROP CONSTRAINT IF EXISTS "content_item_collection_links_pkey";

    ALTER TABLE "content_item_collection_links"
      ADD CONSTRAINT "content_item_collection_links_pkey" PRIMARY KEY ("id");

    ALTER TABLE "content_item_collection_links"
      DROP CONSTRAINT IF EXISTS "content_item_collection_links_content_item_id_collection_id_key";

    ALTER TABLE "content_item_collection_links"
      ADD CONSTRAINT "content_item_collection_links_content_item_id_collection_id_key"
        UNIQUE ("content_item_id", "collection_id");
  END IF;
END $$;

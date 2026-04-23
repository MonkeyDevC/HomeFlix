-- FASE 7: usuarios mínimos (admin/viewer), perfiles vinculados al hogar.

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

ALTER TABLE "profiles" ADD COLUMN "user_id" UUID;

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "profiles_user_id_idx" ON "profiles"("user_id");

-- Contraseñas documentadas en README (solo desarrollo).
INSERT INTO "users" ("id", "email", "password_hash", "role", "created_at", "updated_at")
VALUES
(
    '00000000-0000-4000-8000-000000000001',
    'admin@homeflix.local',
    '$2b$10$kxxXOCRsMfsedU4ln4Ap/ONXnscPRdtRj7HObawOa9cXukCWPe0xO',
    'admin',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    '00000000-0000-4000-8000-000000000002',
    'viewer@homeflix.local',
    '$2b$10$Ig0PhIKJdqh3lU.SIfXtyestlI0mkI1DFpIoXvTX8FPN/Cdx4hN6W',
    'viewer',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

UPDATE "profiles"
SET "user_id" = '00000000-0000-4000-8000-000000000002'
WHERE "user_id" IS NULL;

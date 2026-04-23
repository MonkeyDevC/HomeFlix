-- Contraseña de desarrollo documentada: homeflix-dev (ambos usuarios seed).
UPDATE "users"
SET
  "password_hash" = '$2b$10$/YwmdIwCPq.3aHkT6JY9f.dudCb0k4LcMwWVMfPUqcKN/zwR1ESBq',
  "updated_at" = CURRENT_TIMESTAMP
WHERE "email" IN ('admin@homeflix.local', 'viewer@homeflix.local');

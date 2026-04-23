#!/bin/sh
# HomeFlix Family V1 — entrypoint de producción.
#
# Responsabilidades:
#   1. Validar que las variables mínimas estén definidas (fail-fast claro).
#   2. Aplicar migraciones Prisma en forma idempotente (`migrate deploy`).
#   3. Ejecutar el comando recibido (por defecto `next start`).
#
# El script es intencionalmente POSIX (`/bin/sh`) para que funcione tanto en
# `debian-slim` como en imágenes alpine si alguien cambia la base en el futuro.

set -eu

log() {
  # Prefijo estandarizado y timestamp UTC para que se distingan bien en logs de Docker.
  printf '[homeflix-entrypoint %s] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

# ---------------------------------------------------------------------------
# 1. Validación mínima de entorno.
# ---------------------------------------------------------------------------

missing=""

if [ -z "${DATABASE_URL:-}" ]; then
  missing="${missing} DATABASE_URL"
fi
if [ -z "${FAMILY_JWT_SECRET:-}" ]; then
  missing="${missing} FAMILY_JWT_SECRET"
fi

if [ -n "${missing}" ]; then
  log "ERROR: faltan variables obligatorias:${missing}"
  log "Revisa el .env de producción y vuelve a arrancar el contenedor."
  exit 1
fi

# Longitud mínima de JWT (el server lo valida igual, pero fail-fast acá ayuda al diagnóstico).
secret_len=$(printf '%s' "${FAMILY_JWT_SECRET}" | wc -c | tr -d ' ')
if [ "${secret_len}" -lt 32 ]; then
  log "ERROR: FAMILY_JWT_SECRET debe tener al menos 32 caracteres (actual: ${secret_len})."
  exit 1
fi

log "NODE_ENV=${NODE_ENV:-production}"
log "FAMILY_STORAGE_ROOT=${FAMILY_STORAGE_ROOT:-public/storage}"
log "PORT=${PORT:-3000} HOSTNAME=${HOSTNAME:-0.0.0.0}"

# ---------------------------------------------------------------------------
# 2. Migraciones Prisma (idempotente).
# ---------------------------------------------------------------------------
#
# `prisma migrate deploy` es seguro correrlo en cada arranque: solo aplica las
# migraciones pendientes y es un no-op si todo está al día. El schema Family V1
# vive en apps/client y el generator ya corrió en tiempo de build.
#
# Si se quiere desactivar (por ejemplo para un rollback manual), exportar
# HOMEFLIX_SKIP_MIGRATIONS=1 antes de arrancar.

if [ "${HOMEFLIX_SKIP_MIGRATIONS:-0}" = "1" ]; then
  log "HOMEFLIX_SKIP_MIGRATIONS=1 → omitiendo prisma migrate deploy."
else
  log "Aplicando migraciones Prisma (family_v1) con 'prisma migrate deploy'..."
  cd /repo/apps/client
  if ! pnpm --silent exec prisma migrate deploy; then
    log "ERROR: prisma migrate deploy falló. Revisa DATABASE_URL y el estado de la DB."
    exit 1
  fi
  cd /repo
  log "Migraciones aplicadas OK."
fi

# ---------------------------------------------------------------------------
# 3. Comando principal.
# ---------------------------------------------------------------------------

log "Arrancando proceso principal: $*"
exec "$@"

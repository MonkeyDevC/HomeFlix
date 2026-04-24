#!/usr/bin/env bash
# HomeFlix — despliegue producción (VPS). Ejecutar desde la raíz del repo clonado.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${1:-.env.production}"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: no existe ${ENV_FILE} (usa la ruta al .env o pásala como primer argumento)." >&2
  exit 1
fi

echo "==> Validando compose con ${ENV_FILE}"
"${COMPOSE[@]}" config >/dev/null
echo "    compose config: OK"

echo "==> Construyendo y levantando stack"
"${COMPOSE[@]}" up -d --build

echo "==> Estado de servicios"
"${COMPOSE[@]}" ps

echo "==> Listo. Siguientes pasos sugeridos:"
echo "    - Logs: ${COMPOSE[*]} logs -f client"
echo "    - Health app: curl -sS http://127.0.0.1:\${NGINX_HTTP_PORT:-80}/api/family/healthz"
echo "    - Primer admin: ver docs/deploy-production.md (bootstrap manual)"

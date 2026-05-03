#!/usr/bin/env bash
# Atajo desde la raíz del repo → scripts/deploy-production.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bash "${ROOT}/scripts/deploy-production.sh" "$@"

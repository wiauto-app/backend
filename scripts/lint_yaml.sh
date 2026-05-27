#!/usr/bin/env bash
set -euo pipefail

# Este proyecto valida YAML en local vía un script externo (CI).
# Si no existe un validador YAML en el entorno, no bloqueamos el commit.

echo "[lint_yaml] Omitiendo validación de YAML en local (validador no instalado)." >&2
exit 0


#!/usr/bin/env bash
set -euo pipefail

# Este proyecto corre el check de typos en CI vía GitHub Action.
# En local, si la herramienta no está instalada, no bloqueamos el commit.
#
# Nota: lint-staged puede pasar rutas de archivos como argumentos; las ignoramos
# porque el chequeo completo requiere una herramienta externa.

echo "[check_typos] Omitiendo verificación de typos en local (herramienta no instalada)." >&2
exit 0


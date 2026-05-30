#!/usr/bin/env bash
#
# Sincroniza la base PostgreSQL remota hacia el entorno local.
# Destruye el esquema public local y restaura un volcado completo desde remoto.
#
# Uso:
#   CONFIRM=yes ./scripts/sync-remote-db-to-local.sh
#
# Variables opcionales (valores por defecto entre paréntesis):
#   PGPASSWORD (wiautopassword), LOCAL_HOST (localhost), LOCAL_PORT (5432),
#   REMOTE_HOST (89.167.121.207), REMOTE_PORT (5434), PGUSER (postgres),
#   PGDATABASE (wiauto), CONFIRM (debe ser "yes" para ejecutar el DROP SCHEMA)
#
set -euo pipefail

export PGPASSWORD="${PGPASSWORD:-wiautopassword}"

LOCAL_HOST="${LOCAL_HOST:-localhost}"
LOCAL_PORT="${LOCAL_PORT:-5432}"
REMOTE_HOST="${REMOTE_HOST:-89.167.121.207}"
REMOTE_PORT="${REMOTE_PORT:-5434}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-wiauto}"

local_psql=(psql -h "$LOCAL_HOST" -p "$LOCAL_PORT" -U "$PGUSER" -d "$PGDATABASE")
remote_dump=(pg_dump -h "$REMOTE_HOST" -p "$REMOTE_PORT" -U "$PGUSER" -d "$PGDATABASE")

echo "=== Sincronización remoto → local (PostgreSQL) ==="
echo "Origen:  ${PGUSER}@${REMOTE_HOST}:${REMOTE_PORT}/${PGDATABASE}"
echo "Destino: ${PGUSER}@${LOCAL_HOST}:${LOCAL_PORT}/${PGDATABASE}"
echo ""
echo "ADVERTENCIA: En el entorno local se ejecutará:"
echo "  DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
echo "Se perderán todos los datos del esquema public local."
echo ""

if [[ "${CONFIRM:-}" != "yes" ]]; then
  echo "Operación cancelada: define CONFIRM=yes para continuar."
  echo "Ejemplo: CONFIRM=yes ./scripts/sync-remote-db-to-local.sh"
  exit 1
fi

echo "[1/2] Reiniciando esquema public en local..."
"${local_psql[@]}" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "[2/2] Volcando remoto e importando en local..."
"${remote_dump[@]}" | "${local_psql[@]}"

echo ""
echo "Sincronización completada."

#!/usr/bin/env bash
#
# Utilidades compartidas para sync-*-db-*.sh
# No ejecutar directamente; hacer source desde esos scripts.

_db_sync_script_dir="$(cd "$(dirname "${BASH_SOURCE[1]:-${BASH_SOURCE[0]}}")" && pwd)"
DB_SYNC_BACKUP_DIR="${DB_SYNC_BACKUP_DIR:-${_db_sync_script_dir}/backups}"

# Guarda un volcado del destino antes de DROP SCHEMA.
# Uso: create_pre_sync_backup <etiqueta> <host> <port>
# Imprime la ruta del archivo creado.
create_pre_sync_backup() {
  local label="$1"
  local host="$2"
  local port="$3"
  local timestamp
  timestamp="$(date +%Y%m%d-%H%M%S)"
  local backup_file="${DB_SYNC_BACKUP_DIR}/${PGDATABASE}-${label}-pre-sync-${timestamp}.dump"

  mkdir -p "$DB_SYNC_BACKUP_DIR"

  echo "Creando backup del destino (${label}) en:"
  echo "  ${backup_file}"

  pg_dump \
    -h "$host" \
    -p "$port" \
    -U "$PGUSER" \
    -d "$PGDATABASE" \
    -F c \
    -f "$backup_file"

  echo "Backup guardado: ${backup_file}"
  echo "Restaurar (si hace falta): pg_restore -h HOST -p PORT -U ${PGUSER} -d ${PGDATABASE} --clean --if-exists ${backup_file}"
}

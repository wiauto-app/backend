#!/usr/bin/env bash
#
# Importa el catálogo actualizado desde el crawl (coches_db) hacia Wiauto (destino),
# preservando vehicles.version_id.
#
# Uso:
#   CONFIRM=yes ./scripts/migrations/import-crawl-catalog.sh
#
# Variables opcionales (defaults entre paréntesis):
#   SOURCE_HOST (localhost) SOURCE_PORT (5432) SOURCE_DB (coches_db)
#   SOURCE_USER (coches_user) SOURCE_PASSWORD (coches_password_dev)
#   DEST_HOST (localhost) DEST_PORT (5433) DEST_DB (wiauto)
#   DEST_USER (postgres) DEST_PASSWORD (wiautopassword)
#   BACKUP_DIR (./tmp/catalog-import-backups)
#   SKIP_BACKUP (no) SKIP_MIGRATION (no) DRY_RUN (no)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_FILE="${ROOT_DIR}/scripts/migrations/import-crawl-catalog.sql"

SOURCE_HOST="${SOURCE_HOST:-localhost}"
SOURCE_PORT="${SOURCE_PORT:-5432}"
SOURCE_DB="${SOURCE_DB:-coches_db}"
SOURCE_USER="${SOURCE_USER:-coches_user}"
SOURCE_PASSWORD="${SOURCE_PASSWORD:-coches_password_dev}"

DEST_HOST="${DEST_HOST:-localhost}"
DEST_PORT="${DEST_PORT:-5433}"
DEST_DB="${DEST_DB:-wiauto}"
DEST_USER="${DEST_USER:-postgres}"
DEST_PASSWORD="${DEST_PASSWORD:-wiautopassword}"

BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/tmp/catalog-import-backups}"
SKIP_BACKUP="${SKIP_BACKUP:-no}"
SKIP_MIGRATION="${SKIP_MIGRATION:-no}"
DRY_RUN="${DRY_RUN:-no}"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"

source_psql() {
  PGPASSWORD="${SOURCE_PASSWORD}" psql \
    -h "${SOURCE_HOST}" \
    -p "${SOURCE_PORT}" \
    -U "${SOURCE_USER}" \
    -d "${SOURCE_DB}" \
    -v ON_ERROR_STOP=1 \
    "$@"
}

dest_psql() {
  PGPASSWORD="${DEST_PASSWORD}" psql \
    -h "${DEST_HOST}" \
    -p "${DEST_PORT}" \
    -U "${DEST_USER}" \
    -d "${DEST_DB}" \
    -v ON_ERROR_STOP=1 \
    "$@"
}

echo "=== Importación catálogo crawl → Wiauto ==="
echo "Origen:  ${SOURCE_USER}@${SOURCE_HOST}:${SOURCE_PORT}/${SOURCE_DB}"
echo "Destino: ${DEST_USER}@${DEST_HOST}:${DEST_PORT}/${DEST_DB}"
echo ""

if [[ "${CONFIRM:-}" != "yes" ]]; then
  echo "Operación cancelada: define CONFIRM=yes para continuar."
  echo "Ejemplo: CONFIRM=yes ./scripts/migrations/import-crawl-catalog.sh"
  exit 1
fi

echo "[1/6] Comprobando conectividad..."
source_psql -c "SELECT count(*) AS crawl_makes FROM makes;" >/dev/null
dest_psql -c "SELECT count(*) AS dest_vehicles FROM vehicles;" >/dev/null
echo "OK"

if [[ "${SKIP_BACKUP}" != "yes" ]]; then
  mkdir -p "${BACKUP_DIR}"
  BACKUP_FILE="${BACKUP_DIR}/wiauto-catalog-${TIMESTAMP}.dump"
  echo "[2/6] Backup destino → ${BACKUP_FILE}"
  PGPASSWORD="${DEST_PASSWORD}" pg_dump \
    -h "${DEST_HOST}" \
    -p "${DEST_PORT}" \
    -U "${DEST_USER}" \
    -d "${DEST_DB}" \
    --format=custom \
    --no-owner \
    --no-privileges \
    -t make \
    -t model \
    -t body_type \
    -t fuel_type \
    -t year \
    -t version \
    -t vehicles \
    -f "${BACKUP_FILE}"
  echo "OK"
else
  echo "[2/6] Backup omitido (SKIP_BACKUP=yes)"
fi

if [[ "${SKIP_MIGRATION}" != "yes" ]]; then
  echo "[3/6] Ejecutando migración TypeORM (version_id + índices)..."
  (
    cd "${ROOT_DIR}"
    pnpm migration:run
  )
  echo "OK"
else
  echo "[3/6] Migración TypeORM omitida (SKIP_MIGRATION=yes)"
fi

echo "[4/6] Recreando tablas staging en destino..."
dest_psql <<'SQL'
DROP TABLE IF EXISTS stg_crawl_versions CASCADE;
DROP TABLE IF EXISTS stg_crawl_models CASCADE;
DROP TABLE IF EXISTS stg_crawl_makes CASCADE;
DROP TABLE IF EXISTS stg_crawl_body_types CASCADE;
DROP TABLE IF EXISTS stg_crawl_fuel_types CASCADE;
DROP TABLE IF EXISTS stg_crawl_years CASCADE;

CREATE TABLE stg_crawl_makes (
  id integer PRIMARY KEY,
  section_1_id integer NOT NULL,
  name varchar(100) NOT NULL,
  created_at timestamp NULL
);

CREATE TABLE stg_crawl_models (
  id integer PRIMARY KEY,
  make_id integer NOT NULL,
  model_id integer NOT NULL,
  name varchar(100) NOT NULL,
  created_at timestamp NULL
);

CREATE TABLE stg_crawl_body_types (
  id integer PRIMARY KEY,
  body_type_id integer NOT NULL,
  doors integer NULL,
  name varchar(100) NOT NULL,
  created_at timestamp NULL
);

CREATE TABLE stg_crawl_fuel_types (
  id integer PRIMARY KEY,
  fuel_id integer NOT NULL,
  name varchar(100) NOT NULL,
  created_at timestamp NULL
);

CREATE TABLE stg_crawl_years (
  id integer PRIMARY KEY,
  year integer NOT NULL,
  created_at timestamp NULL
);

CREATE TABLE stg_crawl_versions (
  id integer PRIMARY KEY,
  version_id integer NOT NULL,
  make_id integer NOT NULL,
  model_id integer NOT NULL,
  body_type_id integer NOT NULL,
  fuel_type_id integer NOT NULL,
  year_id integer NOT NULL,
  name varchar(255) NOT NULL,
  created_at timestamp NULL
);
SQL
echo "OK"

echo "[5/6] Copiando datos del crawl a staging..."
copy_table() {
  local source_table="$1"
  local staging_table="$2"
  local columns="$3"

  PGPASSWORD="${SOURCE_PASSWORD}" psql \
    -h "${SOURCE_HOST}" \
    -p "${SOURCE_PORT}" \
    -U "${SOURCE_USER}" \
    -d "${SOURCE_DB}" \
    -v ON_ERROR_STOP=1 \
    -c "COPY (SELECT ${columns} FROM ${source_table}) TO STDOUT WITH CSV" \
  | PGPASSWORD="${DEST_PASSWORD}" psql \
    -h "${DEST_HOST}" \
    -p "${DEST_PORT}" \
    -U "${DEST_USER}" \
    -d "${DEST_DB}" \
    -v ON_ERROR_STOP=1 \
    -c "COPY ${staging_table} (${columns}) FROM STDIN WITH CSV"
}

copy_table "makes" "stg_crawl_makes" "id, section_1_id, name, created_at"
copy_table "models" "stg_crawl_models" "id, make_id, model_id, name, created_at"
copy_table "body_types" "stg_crawl_body_types" "id, body_type_id, doors, name, created_at"
copy_table "fuel_types" "stg_crawl_fuel_types" "id, fuel_id, name, created_at"
copy_table "years" "stg_crawl_years" "id, year, created_at"
copy_table "versions" "stg_crawl_versions" "id, version_id, make_id, model_id, body_type_id, fuel_type_id, year_id, name, created_at"
echo "OK"

if [[ "${DRY_RUN}" == "yes" ]]; then
  echo "[6/6] DRY_RUN=yes → staging listo; no se ejecuta el upsert."
  echo "Revisa conteos abajo y vuelve a lanzar con DRY_RUN=no para aplicar."
else
  echo "[6/6] Ejecutando upsert transaccional..."
  dest_psql -f "${SQL_FILE}"
  echo "Importación completada."
fi

echo ""
echo "Conteos staging:"
dest_psql -c "
SELECT
  (SELECT count(*) FROM stg_crawl_makes) AS stg_makes,
  (SELECT count(*) FROM stg_crawl_models) AS stg_models,
  (SELECT count(*) FROM stg_crawl_body_types) AS stg_body_types,
  (SELECT count(*) FROM stg_crawl_fuel_types) AS stg_fuel_types,
  (SELECT count(*) FROM stg_crawl_years) AS stg_years,
  (SELECT count(*) FROM stg_crawl_versions) AS stg_versions;
"

echo ""
echo "Rollback (si hace falta):"
echo "  pg_restore -h ${DEST_HOST} -p ${DEST_PORT} -U ${DEST_USER} -d ${DEST_DB} --clean --if-exists ${BACKUP_DIR}/wiauto-catalog-${TIMESTAMP}.dump"

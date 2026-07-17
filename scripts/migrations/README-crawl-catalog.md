# Importación segura del catálogo (crawl → Wiauto)

## Objetivo

Copiar makes/models/body_types/fuel_types/years/versions desde la BD del crawl hacia Wiauto **sin truncar** el catálogo destino y **preservando** `vehicles.version_id`.

## Credenciales por defecto

| Rol                        | Host      | Puerto | DB        | Usuario     | Password            |
| -------------------------- | --------- | ------ | --------- | ----------- | ------------------- |
| Origen (crawl)             | localhost | 5432   | coches_db | coches_user | coches_password_dev |
| Destino (Wiauto/`dev.yml`) | localhost | 5433   | wiauto    | postgres    | wiautopassword      |

## Cambios de schema requeridos

Migración TypeORM:

- `src/database/migrations/1782700000000-version-external-id-and-catalog-indexes.ts`

Agrega:

- `version.version_id` (ID externo del crawl, unique parcial)
- `make.section_1_id` (si no existe, unique parcial)
- índices de soporte para importación/consultas

Entidades actualizadas:

- `VersionEntity.version_id`
- `MakeEntity.section_1_id`

## Flujo recomendado

```bash
# 1) Asegura Postgres destino (dev.yml)
docker compose -f dev.yml up -d postgres

# 2) Ejecuta la importación completa (backup + migration + staging + upsert)
cd /path/to/wiauto-backend
CONFIRM=yes ./scripts/migrations/import-crawl-catalog.sh
```

El script:

1. Verifica conexión origen/destino
2. Hace `pg_dump` custom de catálogo + vehicles
3. Corre `pnpm migration:run`
4. Crea tablas `stg_crawl_*`
5. Copia datos del crawl a staging (`COPY ... CSV`)
6. Ejecuta `import-crawl-catalog.sql` (transacción + validaciones + `setval`)

## Variables útiles

```bash
CONFIRM=yes \
SKIP_BACKUP=no \
SKIP_MIGRATION=no \
SOURCE_HOST=localhost SOURCE_PORT=5432 \
DEST_HOST=localhost DEST_PORT=5433 \
./scripts/migrations/import-crawl-catalog.sh
```

- `SKIP_BACKUP=yes` — omite dump previo
- `SKIP_MIGRATION=yes` — si ya corriste la migración TypeORM
- `BACKUP_DIR=./tmp/catalog-import-backups` — carpeta de backups

## Estrategia de mapeo

- `makes.section_1_id` → `make.section_1_id` → `make.id`
- `(make destino, models.model_id)` → `model.id`
- `(body_types.body_type_id, doors)` → `body_type.id` (`doors` NULL ⇒ `0`)
- `fuel_types.fuel_id` → `fuel_type.id`
- `years.year` → `year.id`
- `versions.version_id` → `version.version_id` (conservando `version.id` interno)

Para versiones destino sin `version_id`, se intenta enlazar por:

`make_id + model_id + body_type_id + fuel_type_id + year_id + slug/name`

y se asigna el `version_id` externo sin cambiar la PK usada por vehículos.

## Validaciones

El SQL aborta (`ROLLBACK`) si:

- faltan columnas `make.section_1_id` / `version.version_id`
- hay versions sin mapeo completo
- quedan `vehicles` huérfanos
- hay `version.version_id` duplicados
- faltan versions del crawl en destino

## Verificación post-importación

```sql
-- Conteos
SELECT
  (SELECT count(*) FROM stg_crawl_makes) AS src_makes,
  (SELECT count(*) FROM make WHERE section_1_id IS NOT NULL) AS make_mapped,
  (SELECT count(*) FROM stg_crawl_versions) AS src_versions,
  (SELECT count(*) FROM version WHERE version_id IS NOT NULL) AS version_mapped;

-- Vehículos intactos
SELECT count(*) AS orphan_vehicles
FROM vehicles v
LEFT JOIN version ver ON ver.id = v.version_id
WHERE ver.id IS NULL;

-- Muestra
SELECT id, version_id, name, slug
FROM version
WHERE version_id IS NOT NULL
ORDER BY id DESC
LIMIT 20;
```

También:

1. Abrir un anuncio existente y confirmar marca/modelo/año.
2. Probar filtros de listado por marca/modelo/combustible.
3. Si usas OpenSearch hero search, reindexar facetas.

## Rollback

Restaurar el backup generado por el script:

```bash
pg_restore \
  -h localhost -p 5433 -U postgres -d wiauto \
  --clean --if-exists \
  ./tmp/catalog-import-backups/wiauto-catalog-YYYYMMDD-HHMMSS.dump
```

Nota: `--clean` recrea solo las tablas incluidas en el dump (`make`, `model`, `body_type`, `fuel_type`, `year`, `version`, `vehicles`).

## Archivos

- `scripts/migrations/import-crawl-catalog.sh` — orquestación
- `scripts/migrations/import-crawl-catalog.sql` — upsert transaccional
- `src/database/migrations/1782700000000-version-external-id-and-catalog-indexes.ts`

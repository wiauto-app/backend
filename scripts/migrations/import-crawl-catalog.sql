-- Importación segura del catálogo crawl → destino Wiauto.
-- Requiere tablas staging ya pobladas (ver import-crawl-catalog.sh).
-- Preserva vehicles.version_id (PK interna de version.id).
-- Uso:
--   psql ... -v ON_ERROR_STOP=1 -f scripts/migrations/import-crawl-catalog.sql

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'make'
      AND column_name = 'section_1_id'
  ) THEN
    RAISE EXCEPTION
      'Falta make.section_1_id. Ejecuta la migración TypeORM VersionExternalIdAndCatalogIndexes1782700000000 antes de importar.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'version'
      AND column_name = 'version_id'
  ) THEN
    RAISE EXCEPTION
      'Falta version.version_id. Ejecuta la migración TypeORM VersionExternalIdAndCatalogIndexes1782700000000 antes de importar.';
  END IF;

  IF to_regclass('public.stg_crawl_makes') IS NULL
     OR to_regclass('public.stg_crawl_models') IS NULL
     OR to_regclass('public.stg_crawl_body_types') IS NULL
     OR to_regclass('public.stg_crawl_fuel_types') IS NULL
     OR to_regclass('public.stg_crawl_years') IS NULL
     OR to_regclass('public.stg_crawl_versions') IS NULL
  THEN
    RAISE EXCEPTION
      'Faltan tablas staging stg_crawl_*. Ejecuta import-crawl-catalog.sh o crea/puebla el staging primero.';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION tmp_catalog_slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(
    both '-' FROM regexp_replace(
      regexp_replace(
        lower(
          translate(
            coalesce(nullif(trim(input), ''), 'n-a'),
            'áàäâãåāăąéèëêēĕėęěíìïîĩīĭįıóòöôõōŏőúùüûũūŭůýÿñçÁÀÄÂÃÅĀĂĄÉÈËÊĒĔĖĘĚÍÌÏÎĨĪĬĮİÓÒÖÔÕŌŎŐÚÙÜÛŨŪŬŮÝŸÑÇ',
            'aaaaaaaaaeeeeeeeeeeiiiiiiiiioooooooouuuuuuuuyyncAAAAAAAAAEEEEEEEEEEIIIIIIIIIOOOOOOOOUUUUUUUUYYNC'
          )
        ),
        '[^a-z0-9]+',
        '-',
        'g'
      ),
      '-+',
      '-',
      'g'
    )
  );
$$;

CREATE TEMP TABLE IF NOT EXISTS catalog_import_log (
  entity text NOT NULL,
  action text NOT NULL,
  source_key text NOT NULL,
  target_id integer NOT NULL
) ON COMMIT DROP;

-- ---------------------------------------------------------------------------
-- 1) makes
-- ---------------------------------------------------------------------------

-- Vincular makes existentes sin section_1_id por slug/nombre
UPDATE make AS m
SET section_1_id = s.section_1_id
FROM stg_crawl_makes AS s
WHERE m.section_1_id IS NULL
  AND (
    m.slug = tmp_catalog_slugify(s.name)
    OR lower(m.name) = lower(s.name)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM make AS other
    WHERE other.section_1_id = s.section_1_id
  );

UPDATE make AS m
SET
  name = s.name,
  slug = CASE
    WHEN m.slug IS NULL OR btrim(m.slug) = '' THEN tmp_catalog_slugify(s.name)
    ELSE m.slug
  END
FROM stg_crawl_makes AS s
WHERE m.section_1_id = s.section_1_id;

SELECT setval(
  pg_get_serial_sequence('make', 'id'),
  coalesce((SELECT max(id) FROM make), 1),
  true
);

INSERT INTO make (section_1_id, name, slug)
SELECT
  s.section_1_id,
  s.name,
  tmp_catalog_slugify(s.name)
FROM stg_crawl_makes AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM make AS m
  WHERE m.section_1_id = s.section_1_id
);

INSERT INTO catalog_import_log (entity, action, source_key, target_id)
SELECT
  'make',
  'upsert',
  s.section_1_id::text,
  m.id
FROM stg_crawl_makes AS s
INNER JOIN make AS m ON m.section_1_id = s.section_1_id;

-- ---------------------------------------------------------------------------
-- 2) models
-- ---------------------------------------------------------------------------

UPDATE model AS dest
SET
  name = s.name,
  slug = CASE
    WHEN dest.slug IS NULL OR btrim(dest.slug) = '' THEN tmp_catalog_slugify(s.name)
    ELSE dest.slug
  END
FROM stg_crawl_models AS s
INNER JOIN stg_crawl_makes AS sm ON sm.id = s.make_id
INNER JOIN make AS m ON m.section_1_id = sm.section_1_id
WHERE dest.make_id = m.id
  AND dest.model_id = s.model_id;

SELECT setval(
  pg_get_serial_sequence('model', 'id'),
  coalesce((SELECT max(id) FROM model), 1),
  true
);

INSERT INTO model (make_id, model_id, name, slug)
SELECT
  m.id,
  s.model_id,
  s.name,
  tmp_catalog_slugify(s.name)
FROM stg_crawl_models AS s
INNER JOIN stg_crawl_makes AS sm ON sm.id = s.make_id
INNER JOIN make AS m ON m.section_1_id = sm.section_1_id
WHERE NOT EXISTS (
  SELECT 1
  FROM model AS dest
  WHERE dest.make_id = m.id
    AND dest.model_id = s.model_id
);

INSERT INTO catalog_import_log (entity, action, source_key, target_id)
SELECT
  'model',
  'upsert',
  s.model_id::text,
  dest.id
FROM stg_crawl_models AS s
INNER JOIN stg_crawl_makes AS sm ON sm.id = s.make_id
INNER JOIN make AS m ON m.section_1_id = sm.section_1_id
INNER JOIN model AS dest
  ON dest.make_id = m.id
 AND dest.model_id = s.model_id;

-- ---------------------------------------------------------------------------
-- 3) body_types  (doors NULL del crawl → COALESCE 0)
-- ---------------------------------------------------------------------------

UPDATE body_type AS dest
SET
  name = s.name,
  doors = coalesce(s.doors, 0),
  slug = CASE
    WHEN dest.slug IS NULL OR btrim(dest.slug) = '' THEN tmp_catalog_slugify(s.name)
    ELSE dest.slug
  END
FROM stg_crawl_body_types AS s
WHERE dest.body_type_id = s.body_type_id
  AND dest.doors = coalesce(s.doors, 0);

SELECT setval(
  pg_get_serial_sequence('body_type', 'id'),
  coalesce((SELECT max(id) FROM body_type), 1),
  true
);

INSERT INTO body_type (body_type_id, doors, name, slug)
SELECT
  s.body_type_id,
  coalesce(s.doors, 0),
  s.name,
  tmp_catalog_slugify(s.name)
FROM stg_crawl_body_types AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM body_type AS dest
  WHERE dest.body_type_id = s.body_type_id
    AND dest.doors = coalesce(s.doors, 0)
);

INSERT INTO catalog_import_log (entity, action, source_key, target_id)
SELECT
  'body_type',
  'upsert',
  s.body_type_id::text || ':' || coalesce(s.doors, 0)::text,
  dest.id
FROM stg_crawl_body_types AS s
INNER JOIN body_type AS dest
  ON dest.body_type_id = s.body_type_id
 AND dest.doors = coalesce(s.doors, 0);

-- ---------------------------------------------------------------------------
-- 4) fuel_types
-- ---------------------------------------------------------------------------

UPDATE fuel_type AS dest
SET
  name = s.name,
  slug = CASE
    WHEN dest.slug IS NULL OR btrim(dest.slug) = '' THEN tmp_catalog_slugify(s.name)
    ELSE dest.slug
  END
FROM stg_crawl_fuel_types AS s
WHERE dest.fuel_id = s.fuel_id;

SELECT setval(
  pg_get_serial_sequence('fuel_type', 'id'),
  coalesce((SELECT max(id) FROM fuel_type), 1),
  true
);

INSERT INTO fuel_type (fuel_id, name, slug, can_charge)
SELECT
  s.fuel_id,
  s.name,
  tmp_catalog_slugify(s.name),
  false
FROM stg_crawl_fuel_types AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM fuel_type AS dest
  WHERE dest.fuel_id = s.fuel_id
);

INSERT INTO catalog_import_log (entity, action, source_key, target_id)
SELECT
  'fuel_type',
  'upsert',
  s.fuel_id::text,
  dest.id
FROM stg_crawl_fuel_types AS s
INNER JOIN fuel_type AS dest ON dest.fuel_id = s.fuel_id;

-- ---------------------------------------------------------------------------
-- 5) years
-- ---------------------------------------------------------------------------

UPDATE year AS dest
SET
  slug = CASE
    WHEN dest.slug IS NULL OR btrim(dest.slug) = '' THEN tmp_catalog_slugify(s.year::text)
    ELSE dest.slug
  END
FROM stg_crawl_years AS s
WHERE dest.year = s.year;

SELECT setval(
  pg_get_serial_sequence('year', 'id'),
  coalesce((SELECT max(id) FROM year), 1),
  true
);

INSERT INTO year (year, slug)
SELECT
  s.year,
  tmp_catalog_slugify(s.year::text)
FROM stg_crawl_years AS s
WHERE NOT EXISTS (
  SELECT 1
  FROM year AS dest
  WHERE dest.year = s.year
);

INSERT INTO catalog_import_log (entity, action, source_key, target_id)
SELECT
  'year',
  'upsert',
  s.year::text,
  dest.id
FROM stg_crawl_years AS s
INNER JOIN year AS dest ON dest.year = s.year;

-- ---------------------------------------------------------------------------
-- Mapas de IDs para versions
-- ---------------------------------------------------------------------------

CREATE TEMP TABLE map_make ON COMMIT DROP AS
SELECT
  sm.id AS source_make_pk,
  sm.section_1_id,
  m.id AS target_make_id
FROM stg_crawl_makes AS sm
INNER JOIN make AS m ON m.section_1_id = sm.section_1_id;

CREATE TEMP TABLE map_model ON COMMIT DROP AS
SELECT
  s.id AS source_model_pk,
  s.model_id AS source_model_external_id,
  dest.id AS target_model_id,
  dest.make_id AS target_make_id
FROM stg_crawl_models AS s
INNER JOIN stg_crawl_makes AS sm ON sm.id = s.make_id
INNER JOIN make AS m ON m.section_1_id = sm.section_1_id
INNER JOIN model AS dest
  ON dest.make_id = m.id
 AND dest.model_id = s.model_id;

CREATE TEMP TABLE map_body_type ON COMMIT DROP AS
SELECT
  s.id AS source_body_type_pk,
  dest.id AS target_body_type_id
FROM stg_crawl_body_types AS s
INNER JOIN body_type AS dest
  ON dest.body_type_id = s.body_type_id
 AND dest.doors = coalesce(s.doors, 0);

CREATE TEMP TABLE map_fuel_type ON COMMIT DROP AS
SELECT
  s.id AS source_fuel_type_pk,
  dest.id AS target_fuel_type_id
FROM stg_crawl_fuel_types AS s
INNER JOIN fuel_type AS dest ON dest.fuel_id = s.fuel_id;

CREATE TEMP TABLE map_year ON COMMIT DROP AS
SELECT
  s.id AS source_year_pk,
  dest.id AS target_year_id
FROM stg_crawl_years AS s
INNER JOIN year AS dest ON dest.year = s.year;

CREATE TEMP TABLE resolved_versions ON COMMIT DROP AS
SELECT
  sv.version_id AS external_version_id,
  sv.name AS source_name,
  tmp_catalog_slugify(sv.name) AS source_slug,
  mm.target_make_id,
  mo.target_model_id,
  mb.target_body_type_id,
  mf.target_fuel_type_id,
  my.target_year_id
FROM stg_crawl_versions AS sv
LEFT JOIN map_make AS mm ON mm.source_make_pk = sv.make_id
LEFT JOIN map_model AS mo ON mo.source_model_pk = sv.model_id
LEFT JOIN map_body_type AS mb ON mb.source_body_type_pk = sv.body_type_id
LEFT JOIN map_fuel_type AS mf ON mf.source_fuel_type_pk = sv.fuel_type_id
LEFT JOIN map_year AS my ON my.source_year_pk = sv.year_id;

DO $$
DECLARE
  unresolved_count integer;
BEGIN
  SELECT count(*)
  INTO unresolved_count
  FROM resolved_versions
  WHERE target_make_id IS NULL
     OR target_model_id IS NULL
     OR target_body_type_id IS NULL
     OR target_fuel_type_id IS NULL
     OR target_year_id IS NULL;

  IF unresolved_count > 0 THEN
    RAISE EXCEPTION
      'Hay % versions del crawl sin mapeo completo de make/model/body_type/fuel_type/year. Revisa staging y claves externas.',
      unresolved_count;
  END IF;
END $$;

-- Vincular versions existentes por version_id externo
UPDATE version AS v
SET
  name = rv.source_name,
  slug = CASE
    WHEN v.slug IS NULL OR btrim(v.slug) = '' THEN rv.source_slug
    ELSE v.slug
  END,
  make_id = rv.target_make_id,
  model_id = rv.target_model_id,
  body_type_id = rv.target_body_type_id,
  fuel_type_id = rv.target_fuel_type_id,
  year_id = rv.target_year_id
FROM resolved_versions AS rv
WHERE v.version_id = rv.external_version_id;

-- Vincular versions existentes sin version_id por clave compuesta + slug/name
-- eligiendo una sola fila destino (protege vehicles.version_id)
WITH candidates AS (
  SELECT
    rv.external_version_id,
    rv.source_name,
    rv.source_slug,
    rv.target_make_id,
    rv.target_model_id,
    rv.target_body_type_id,
    rv.target_fuel_type_id,
    rv.target_year_id,
    v.id AS target_version_pk,
    row_number() OVER (
      PARTITION BY rv.external_version_id
      ORDER BY
        CASE WHEN v.slug = rv.source_slug THEN 0 ELSE 1 END,
        CASE WHEN lower(v.name) = lower(rv.source_name) THEN 0 ELSE 1 END,
        v.id
    ) AS rn
  FROM resolved_versions AS rv
  INNER JOIN version AS v
    ON v.make_id = rv.target_make_id
   AND v.model_id = rv.target_model_id
   AND v.body_type_id = rv.target_body_type_id
   AND v.fuel_type_id = rv.target_fuel_type_id
   AND v.year_id = rv.target_year_id
  WHERE v.version_id IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM version AS other
      WHERE other.version_id = rv.external_version_id
    )
)
UPDATE version AS v
SET
  version_id = c.external_version_id,
  name = c.source_name,
  slug = CASE
    WHEN v.slug IS NULL OR btrim(v.slug) = '' THEN c.source_slug
    ELSE v.slug
  END
FROM candidates AS c
WHERE c.rn = 1
  AND v.id = c.target_version_pk;

-- Insertar versions nuevas
SELECT setval(
  pg_get_serial_sequence('version', 'id'),
  coalesce((SELECT max(id) FROM version), 1),
  true
);

INSERT INTO version (
  version_id,
  make_id,
  model_id,
  body_type_id,
  fuel_type_id,
  year_id,
  name,
  slug
)
SELECT
  rv.external_version_id,
  rv.target_make_id,
  rv.target_model_id,
  rv.target_body_type_id,
  rv.target_fuel_type_id,
  rv.target_year_id,
  rv.source_name,
  rv.source_slug
FROM resolved_versions AS rv
WHERE NOT EXISTS (
  SELECT 1
  FROM version AS v
  WHERE v.version_id = rv.external_version_id
);

INSERT INTO catalog_import_log (entity, action, source_key, target_id)
SELECT
  'version',
  'upsert',
  rv.external_version_id::text,
  v.id
FROM resolved_versions AS rv
INNER JOIN version AS v ON v.version_id = rv.external_version_id;

-- ---------------------------------------------------------------------------
-- Validaciones finales
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  orphan_vehicles integer;
  duplicate_external_versions integer;
  missing_import_versions integer;
BEGIN
  SELECT count(*)
  INTO orphan_vehicles
  FROM vehicles AS veh
  LEFT JOIN version AS v ON v.id = veh.version_id
  WHERE v.id IS NULL;

  IF orphan_vehicles > 0 THEN
    RAISE EXCEPTION
      'Quedaron % vehicles con version_id huérfano. Se aborta la importación.',
      orphan_vehicles;
  END IF;

  SELECT count(*)
  INTO duplicate_external_versions
  FROM (
    SELECT version_id
    FROM version
    WHERE version_id IS NOT NULL
    GROUP BY version_id
    HAVING count(*) > 1
  ) AS d;

  IF duplicate_external_versions > 0 THEN
    RAISE EXCEPTION
      'Hay % version.version_id duplicados tras la importación.',
      duplicate_external_versions;
  END IF;

  SELECT count(*)
  INTO missing_import_versions
  FROM stg_crawl_versions AS s
  LEFT JOIN version AS v ON v.version_id = s.version_id
  WHERE v.id IS NULL;

  IF missing_import_versions > 0 THEN
    RAISE EXCEPTION
      'Faltan % versions del crawl sin insertar/actualizar en destino.',
      missing_import_versions;
  END IF;
END $$;

-- Ajustar secuencias
SELECT setval(pg_get_serial_sequence('make', 'id'), coalesce((SELECT max(id) FROM make), 1), true);
SELECT setval(pg_get_serial_sequence('model', 'id'), coalesce((SELECT max(id) FROM model), 1), true);
SELECT setval(pg_get_serial_sequence('body_type', 'id'), coalesce((SELECT max(id) FROM body_type), 1), true);
SELECT setval(pg_get_serial_sequence('fuel_type', 'id'), coalesce((SELECT max(id) FROM fuel_type), 1), true);
SELECT setval(pg_get_serial_sequence('year', 'id'), coalesce((SELECT max(id) FROM year), 1), true);
SELECT setval(pg_get_serial_sequence('version', 'id'), coalesce((SELECT max(id) FROM version), 1), true);

-- Resumen
SELECT entity, count(*) AS rows_logged
FROM catalog_import_log
GROUP BY entity
ORDER BY entity;

SELECT
  (SELECT count(*) FROM stg_crawl_makes) AS src_makes,
  (SELECT count(*) FROM make WHERE section_1_id IS NOT NULL) AS dest_makes_mapped,
  (SELECT count(*) FROM stg_crawl_models) AS src_models,
  (SELECT count(*) FROM model) AS dest_models,
  (SELECT count(*) FROM stg_crawl_versions) AS src_versions,
  (SELECT count(*) FROM version WHERE version_id IS NOT NULL) AS dest_versions_mapped,
  (SELECT count(*) FROM vehicles) AS vehicles_count;

DROP FUNCTION IF EXISTS tmp_catalog_slugify(text);

COMMIT;

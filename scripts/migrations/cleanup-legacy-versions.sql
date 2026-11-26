-- Limpieza de versiones legacy del catálogo (public.version sin version_id externo).
--
-- Contexto: el import antiguo creaba una fila de `version` por cada (versión, año)
-- y sin `version_id` de coches.net. Con la relación N:M (`version_year`) esas
-- filas quedan duplicadas junto a la versión canónica (la que sí tiene
-- `version_id`). Este script fusiona cada fila legacy en su canónica:
--   1. pasa sus años a `version_year` de la canónica,
--   2. reasigna `vehicles` y `appraisal_requests` a la canónica (el año del
--      vehículo / tasación se conserva, y su par versión–año queda garantizado),
--   3. borra la fila legacy (sus pares en `version_year` caen en cascada).
--
-- Reglas de emparejamiento (misma marca, modelo, carrocería, combustible y
-- nombre normalizado lower(btrim(name))):
--   external_unique  : hay exactamente 1 versión externa con esa clave.
--   external_by_year : hay varias externas, pero solo 1 ya tiene el año del legacy.
--   legacy_group     : ninguna externa; los legacy de la misma clave se colapsan
--                      en el de menor id (su año por defecto pasa a ser el más reciente).
-- Los legacy ambiguos (varias externas y ninguna/varias con su año) NO se tocan.
--
-- Ejecutar DESPUÉS del merge del crawl (`POST /api/sync/merge`), con un rol
-- con permisos de escritura en version, version_year, vehicles y appraisal_requests.
--
-- Por defecto es DRY-RUN (muestra el resumen y hace ROLLBACK):
--   psql "$DB_URL" -f scripts/migrations/cleanup-legacy-versions.sql
-- Para aplicar:
--   psql "$DB_URL" -v apply=true -f scripts/migrations/cleanup-legacy-versions.sql

\set ON_ERROR_STOP on
\if :{?apply}
\else
\set apply false
\endif

BEGIN;

CREATE TEMP TABLE legacy_map (
  legacy_id    int PRIMARY KEY,
  canonical_id int NOT NULL,
  reason       text NOT NULL
) ON COMMIT DROP;

-- 1. Una sola versión externa con la misma clave.
INSERT INTO legacy_map (legacy_id, canonical_id, reason)
SELECT l.id, min(e.id), 'external_unique'
FROM version l
JOIN version e
  ON e.version_id IS NOT NULL
 AND e.make_id = l.make_id
 AND e.model_id = l.model_id
 AND e.body_type_id = l.body_type_id
 AND e.fuel_type_id = l.fuel_type_id
 AND lower(btrim(e.name)) = lower(btrim(l.name))
WHERE l.version_id IS NULL
GROUP BY l.id
HAVING count(*) = 1;

-- 2. Varias externas: la única que ya existe en el año del legacy.
INSERT INTO legacy_map (legacy_id, canonical_id, reason)
SELECT l.id, min(e.id), 'external_by_year'
FROM version l
JOIN version e
  ON e.version_id IS NOT NULL
 AND e.make_id = l.make_id
 AND e.model_id = l.model_id
 AND e.body_type_id = l.body_type_id
 AND e.fuel_type_id = l.fuel_type_id
 AND lower(btrim(e.name)) = lower(btrim(l.name))
JOIN version_year vy
  ON vy.version_id = e.id
 AND vy.year_id = l.year_id
WHERE l.version_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM legacy_map m WHERE m.legacy_id = l.id)
GROUP BY l.id
HAVING count(*) = 1;

-- 3. Sin ninguna externa: colapsar los legacy de la misma clave en el de menor id.
INSERT INTO legacy_map (legacy_id, canonical_id, reason)
SELECT id, canonical_id, 'legacy_group'
FROM (
  SELECT l.id,
         min(l.id) OVER (
           PARTITION BY l.make_id, l.model_id, l.body_type_id, l.fuel_type_id,
                        lower(btrim(l.name))
         ) AS canonical_id
  FROM version l
  WHERE l.version_id IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM version e
      WHERE e.version_id IS NOT NULL
        AND e.make_id = l.make_id
        AND e.model_id = l.model_id
        AND e.body_type_id = l.body_type_id
        AND e.fuel_type_id = l.fuel_type_id
        AND lower(btrim(e.name)) = lower(btrim(l.name))
    )
) t
WHERE id <> canonical_id;

-- Resumen previo
SELECT reason, count(*) AS legacy_rows, count(DISTINCT canonical_id) AS canonicals
FROM legacy_map GROUP BY reason ORDER BY reason;

SELECT
  (SELECT count(*) FROM version WHERE version_id IS NULL)                         AS legacy_total,
  (SELECT count(*) FROM legacy_map)                                              AS legacy_to_merge,
  (SELECT count(*) FROM vehicles v JOIN legacy_map m ON m.legacy_id = v.version_id) AS vehicles_to_repoint,
  (SELECT count(*) FROM appraisal_requests a JOIN legacy_map m ON m.legacy_id = a.version_id) AS appraisals_to_repoint;

-- Años: los pares del legacy, su año por defecto y los años de sus vehículos / tasaciones.
INSERT INTO version_year (version_id, year_id)
SELECT DISTINCT m.canonical_id, vy.year_id
FROM legacy_map m
JOIN version_year vy ON vy.version_id = m.legacy_id
ON CONFLICT DO NOTHING;

INSERT INTO version_year (version_id, year_id)
SELECT DISTINCT m.canonical_id, l.year_id
FROM legacy_map m
JOIN version l ON l.id = m.legacy_id
WHERE l.year_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO version_year (version_id, year_id)
SELECT DISTINCT m.canonical_id, v.year_id
FROM vehicles v
JOIN legacy_map m ON m.legacy_id = v.version_id
WHERE v.year_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO version_year (version_id, year_id)
SELECT DISTINCT m.canonical_id, a.year_id
FROM appraisal_requests a
JOIN legacy_map m ON m.legacy_id = a.version_id
WHERE a.year_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Reasignar referencias (el year_id propio de vehículos / tasaciones no cambia).
UPDATE vehicles v
SET version_id = m.canonical_id
FROM legacy_map m
WHERE v.version_id = m.legacy_id;

UPDATE appraisal_requests a
SET version_id = m.canonical_id
FROM legacy_map m
WHERE a.version_id = m.legacy_id;

-- Borrar legacy fusionados (version_year en cascada).
DELETE FROM version v
USING legacy_map m
WHERE v.id = m.legacy_id;

-- Canónicas legacy_group: año por defecto = el más reciente de sus pares.
UPDATE version c
SET year_id = latest.year_id
FROM (
  SELECT DISTINCT ON (vy.version_id) vy.version_id, vy.year_id
  FROM version_year vy
  JOIN year y ON y.id = vy.year_id
  WHERE vy.version_id IN (
    SELECT canonical_id FROM legacy_map WHERE reason = 'legacy_group'
  )
  ORDER BY vy.version_id, y.year DESC
) latest
WHERE c.id = latest.version_id
  AND c.year_id IS DISTINCT FROM latest.year_id;

-- Validación: ningún vehículo / tasación con un año que su versión no tenga.
DO $$
DECLARE
  bad_vehicles int;
  bad_appraisals int;
BEGIN
  SELECT count(*) INTO bad_vehicles
  FROM vehicles v
  WHERE v.year_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM version_year vy
      WHERE vy.version_id = v.version_id AND vy.year_id = v.year_id
    );
  SELECT count(*) INTO bad_appraisals
  FROM appraisal_requests a
  WHERE a.version_id IS NOT NULL AND a.year_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM version_year vy
      WHERE vy.version_id = a.version_id AND vy.year_id = a.year_id
    );
  IF bad_vehicles > 0 OR bad_appraisals > 0 THEN
    RAISE EXCEPTION 'Pares versión–año inválidos tras la limpieza: vehicles=%, appraisal_requests=%',
      bad_vehicles, bad_appraisals;
  END IF;
END $$;

-- Resumen final
SELECT
  (SELECT count(*) FROM version)                         AS versions,
  (SELECT count(*) FROM version WHERE version_id IS NULL) AS legacy_remaining,
  (SELECT count(*) FROM version_year)                    AS version_years;

\if :apply
COMMIT;
\echo 'Limpieza APLICADA (COMMIT).'
\else
ROLLBACK;
\echo 'DRY-RUN: cambios descartados (ROLLBACK). Usa -v apply=true para aplicar.'
\endif

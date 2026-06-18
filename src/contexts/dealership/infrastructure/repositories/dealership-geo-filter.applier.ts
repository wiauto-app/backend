import { SelectQueryBuilder } from "typeorm";

import { DealershipsFilter } from "../../domain/filters/dealerships.filter";
import { DealershipEntity } from "../persistence/dealership.entity";

const is_finite_number = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const has_non_empty_string = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/** Punto de la concesionaria en SRID 4326 (lng/lat como en PostGIS ST_MakePoint). */
export const sql_dealership_point =
  "ST_SetSRID(ST_MakePoint(CAST(d.lng AS double precision), CAST(d.lat AS double precision)), 4326)";

export type DealershipGeoFilterMode =
  | "point"
  | "province_centroid"
  | "province_polygon"
  | "none";

export interface DealershipGeoContext {
  mode: DealershipGeoFilterMode;
  distanceOrderSql?: string;
  distanceOrderParams?: Record<string, string | number>;
}

export const sql_active_vehicles_count_subquery = `(SELECT COUNT(v.id) FROM vehicles v
 INNER JOIN dealership_members dm ON dm.profile_id = v.profile_id
 WHERE dm.dealership_id = d.id AND v.status = 'active' AND v.deleted_at IS NULL)`;

/**
 * Reglas geo:
 * - `lat` + `lng` + `radius > 0`: ST_DWithin desde el punto del filtro.
 * - `province_slug` + `radius > 0`: ST_DWithin desde el centroide de la provincia.
 * - `province_slug` + sin radio / `radius = 0`: ST_Intersects con el polígono provincial.
 * - Solo `lat`/`lng` sin `radius`: no aplica filtro geo.
 *
 * Si hay punto con radio, tiene prioridad sobre `province_slug`.
 */
export const applyDealershipGeoFilter = (
  qb: SelectQueryBuilder<DealershipEntity>,
  filter: Pick<DealershipsFilter, "lat" | "lng" | "radius" | "province_slug">,
): DealershipGeoContext => {
  const ctx: DealershipGeoContext = { mode: "none" };

  if (
    is_finite_number(filter.lat) &&
    is_finite_number(filter.lng) &&
    is_finite_number(filter.radius) &&
    filter.radius > 0
  ) {
    const lat = filter.lat;
    const lng = filter.lng;
    const radius = filter.radius;

    qb.andWhere("d.lat IS NOT NULL AND d.lng IS NOT NULL");
    qb.andWhere(
      `ST_DWithin(
        ${sql_dealership_point}::geography,
        ST_SetSRID(
          ST_MakePoint(CAST(:filter_lng AS double precision), CAST(:filter_lat AS double precision)),
          4326
        )::geography,
        CAST(:filter_radius AS double precision)
      )`,
      {
        filter_lat: lat,
        filter_lng: lng,
        filter_radius: radius,
      },
    );

    ctx.mode = "point";
    ctx.distanceOrderSql = `ST_Distance(
      ${sql_dealership_point}::geography,
      ST_SetSRID(
        ST_MakePoint(CAST(:filter_lng AS double precision), CAST(:filter_lat AS double precision)),
        4326
      )::geography
    )`;
    ctx.distanceOrderParams = { filter_lat: lat, filter_lng: lng };
    return ctx;
  }

  if (!has_non_empty_string(filter.province_slug)) {
    return ctx;
  }

  const province_slug = filter.province_slug.trim();

  if (is_finite_number(filter.radius) && filter.radius > 0) {
    const radius = filter.radius;

    qb.andWhere("d.lat IS NOT NULL AND d.lng IS NOT NULL");
    qb.andWhere(
      `ST_DWithin(
        ${sql_dealership_point}::geography,
        (
          SELECT ST_Centroid(p.geom)::geography
          FROM provinces p
          WHERE p.slug = :province_slug
          LIMIT 1
        ),
        CAST(:filter_radius AS double precision)
      )`,
      {
        province_slug,
        filter_radius: radius,
      },
    );

    ctx.mode = "province_centroid";
    ctx.distanceOrderSql = `ST_Distance(
      ${sql_dealership_point}::geography,
      (
        SELECT ST_Centroid(p.geom)::geography
        FROM provinces p
        WHERE p.slug = :province_slug_dist
        LIMIT 1
      )
    )`;
    ctx.distanceOrderParams = { province_slug_dist: province_slug };
    return ctx;
  }

  qb.andWhere("d.lat IS NOT NULL AND d.lng IS NOT NULL");
  qb.andWhere(
    `EXISTS (
      SELECT 1 FROM provinces p
      WHERE p.slug = :province_slug
        AND ST_Intersects(${sql_dealership_point}, p.geom)
    )`,
    { province_slug },
  );
  ctx.mode = "province_polygon";
  return ctx;
};

/** Alias usado por el repositorio. */
export const applyDealershipGeoFilters = applyDealershipGeoFilter;

export const applyDealershipRatingSinceFilter = (
  qb: SelectQueryBuilder<DealershipEntity>,
  rating_since: number | undefined,
): void => {
  if (!is_finite_number(rating_since)) {
    return;
  }
  qb.andWhere("d.rating >= :rating_since", { rating_since });
};

export const applyDealershipVehiclesNumberFilter = (
  qb: SelectQueryBuilder<DealershipEntity>,
  vehicles_number: number | undefined,
): void => {
  if (!is_finite_number(vehicles_number)) {
    return;
  }
  qb.andWhere(`${sql_active_vehicles_count_subquery} >= :vehicles_number`, {
    vehicles_number,
  });
};

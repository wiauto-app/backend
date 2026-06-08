import { SelectQueryBuilder } from "typeorm";

import { VehicleFilter } from "../../domain/filters/vehicle.filter";
import { VehicleEntity } from "../persistence/vehicle.entity";
import { AdminVehicleFilter } from "../../domain/filters/admin-vehicle.filter";
import { MakeModelFilterMode } from "./make-model-filter-mode.utils";

export interface ApplyFiltersOptions {
  make_model_filter_mode?: MakeModelFilterMode;
}

const has_non_empty_string = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const is_finite_number = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const is_valid_date = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

const has_non_empty_string_array = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every((item) => typeof item === "string" && item.length > 0);

const trim_slug_array = (value: string[]): string[] =>
  value.map((s) => s.trim()).filter((s) => s.length > 0);

/** Punto del anuncio en SRID 4326 (lng/lat como en PostGIS ST_MakePoint). */
const sql_vehicle_point =
  "ST_SetSRID(ST_MakePoint(CAST(vehicle.lng AS double precision), CAST(vehicle.lat AS double precision)), 4326)";

/**
 * Añade condiciones al QB principal (`vehicle`).
 *
 * Ubicación por polígonos: `provinces_slugs` / `comunities_slugs` / `municipalities_slugs`
 * resuelven la fila en la tabla de localización y exigen `ST_Intersects(punto_vehículo, geom)`.
 * Varios slugs del mismo tipo van en OR; entre tipos también OR (coincide con cualquier zona elegida).
 *
 * `lat` + `lng` + `radius` (metros): `ST_DWithin` en geografía; si además hay filtros por polígono,
 * se combinan con AND (debe cumplir el grupo de polígonos y el radio, si ambos se envían).
 *
 * `price_offer`: sin columna en `vehicles`; pendiente de regla de negocio.
 */
export const applyFilters = (
  qb: SelectQueryBuilder<VehicleEntity>,
  filters: VehicleFilter,
  options?: ApplyFiltersOptions,
): void => {
  if (has_non_empty_string(filters.type_slug)) {
    qb.andWhere("vehicle_type.slug = :type_slug", {
      type_slug: filters.type_slug,
    });
  }

  const makes_slugs = has_non_empty_string_array(filters.makes_slugs)
    ? trim_slug_array(filters.makes_slugs)
    : [];
  const models_slugs = has_non_empty_string_array(filters.models_slugs)
    ? trim_slug_array(filters.models_slugs)
    : [];

  const needs_catalog_version =
    makes_slugs.length > 0 ||
    models_slugs.length > 0 ||
    is_finite_number(filters.since_year) ||
    is_finite_number(filters.until_year) ||
    has_non_empty_string_array(filters.fuel_type_slugs);

  if (needs_catalog_version) {
    qb.leftJoin("vehicle.version", "catalog_ver");
  }

  const use_make_model_or =
    makes_slugs.length > 0 &&
    models_slugs.length > 0 &&
    options?.make_model_filter_mode === "or";

  if (use_make_model_or) {
    qb.leftJoin(
      "make",
      "cat_make",
      "cat_make.id = catalog_ver.make_id",
    ).leftJoin(
      "model",
      "cat_model",
      "cat_model.id = catalog_ver.model_id",
    ).andWhere(
      "(cat_make.slug IN (:...makes_slugs) OR cat_model.slug IN (:...models_slugs))",
      { makes_slugs, models_slugs },
    );
  } else {
    if (makes_slugs.length > 0) {
      qb.leftJoin(
        "make",
        "cat_make",
        "cat_make.id = catalog_ver.make_id",
      ).andWhere("cat_make.slug IN (:...makes_slugs)", { makes_slugs });
    }

    if (models_slugs.length > 0) {
      qb.leftJoin(
        "model",
        "cat_model",
        "cat_model.id = catalog_ver.model_id",
      ).andWhere("cat_model.slug IN (:...models_slugs)", { models_slugs });
    }
  }

  if (is_finite_number(filters.since_year) || is_finite_number(filters.until_year)) {
    qb.leftJoin("year", "cat_year", "cat_year.id = catalog_ver.year_id");
    if (is_finite_number(filters.since_year)) {
      qb.andWhere("cat_year.year >= :since_year", {
        since_year: filters.since_year,
      });
    }
    if (is_finite_number(filters.until_year)) {
      qb.andWhere("cat_year.year <= :until_year", {
        until_year: filters.until_year,
      });
    }
  }

  if (has_non_empty_string_array(filters.fuel_type_slugs)) {
    qb.leftJoin(
      "fuel_type",
      "cat_fuel",
      "cat_fuel.id = catalog_ver.fuel_type_id",
    ).andWhere("cat_fuel.slug IN (:...fuel_type_slugs)", {
      fuel_type_slugs: filters.fuel_type_slugs,
    });
  }

  if (is_finite_number(filters.since_price) || is_finite_number(filters.until_price)) {
    qb.innerJoin(
      "vehicle_prices",
      "price_filter_vp",
      "price_filter_vp.vehicle_id = vehicle.id AND price_filter_vp.status = 'active'",
    );
  }

  if (is_finite_number(filters.since_price)) {
    qb.andWhere("price_filter_vp.price >= :since_price", {
      since_price: filters.since_price,
    });
  }

  if (is_finite_number(filters.until_price)) {
    qb.andWhere("price_filter_vp.price <= :until_price", {
      until_price: filters.until_price,
    });
  }

  // price_offer: sin campo en entidad; ver comentario en cabecera.

  const region_clauses: string[] = [];
  const region_params: Record<string, unknown> = {};

  if (has_non_empty_string_array(filters.provinces_slugs)) {
    const provinces_slugs = trim_slug_array(filters.provinces_slugs);
    if (provinces_slugs.length > 0) {
      region_clauses.push(
        `EXISTS (SELECT 1 FROM provinces loc_p WHERE loc_p.slug IN (:...provinces_slugs) AND ST_Intersects(${sql_vehicle_point}, loc_p.geom))`,
      );
      region_params.provinces_slugs = provinces_slugs;
    }
  }

  if (has_non_empty_string_array(filters.comunities_slugs)) {
    const comunities_slugs = trim_slug_array(filters.comunities_slugs);
    if (comunities_slugs.length > 0) {
      region_clauses.push(
        `EXISTS (SELECT 1 FROM communities loc_c WHERE loc_c.slug IN (:...comunities_slugs) AND ST_Intersects(${sql_vehicle_point}, loc_c.geom))`,
      );
      region_params.comunities_slugs = comunities_slugs;
    }
  }

  if (has_non_empty_string_array(filters.municipalities_slugs)) {
    const municipalities_slugs = trim_slug_array(filters.municipalities_slugs);
    if (municipalities_slugs.length > 0) {
      region_clauses.push(
        `EXISTS (SELECT 1 FROM municipalities loc_m WHERE loc_m.slug IN (:...municipalities_slugs) AND ST_Intersects(${sql_vehicle_point}, loc_m.geom))`,
      );
      region_params.municipalities_slugs = municipalities_slugs;
    }
  }

  if (region_clauses.length > 0) {
    qb.andWhere(`(${region_clauses.join(" OR ")})`, region_params);
  }

  if (
    is_finite_number(filters.lat) &&
    is_finite_number(filters.lng) &&
    is_finite_number(filters.radius) &&
    filters.radius > 0
  ) {
    qb.andWhere(
      `ST_DWithin(
        ${sql_vehicle_point}::geography,
        ST_SetSRID(
          ST_MakePoint(CAST(:filter_lng AS double precision), CAST(:filter_lat AS double precision)),
          4326
        )::geography,
        CAST(:filter_radius AS double precision)
      )`,
      {
        filter_lat: filters.lat,
        filter_lng: filters.lng,
        filter_radius: filters.radius,
      },
    );
  }

  if (has_non_empty_string_array(filters.service_slugs)) {
    qb.andWhere(
      `EXISTS (
        SELECT 1 FROM vehicle_services vs
        INNER JOIN services svc ON svc.id = vs."servicesId"
        WHERE vs."vehiclesId" = vehicle.id AND svc.slug IN (:...service_slugs)
      )`,
      { service_slugs: filters.service_slugs },
    );
  }

  if (has_non_empty_string_array(filters.publisher_types)) {
    qb.andWhere("vehicle.publisher_type IN (:...publisher_types)", {
      publisher_types: filters.publisher_types,
    });
  }

  if (typeof filters.is_seller_featured === "boolean") {
    qb.andWhere("vehicle.is_featured = :is_seller_featured", {
      is_seller_featured: filters.is_seller_featured,
    });
  }

  if (has_non_empty_string_array(filters.warranty_slugs)) {
    qb.andWhere("warranty_type.slug IN (:...warranty_slugs)", {
      warranty_slugs: filters.warranty_slugs,
    });
  }

  if (is_finite_number(filters.since_mileage)) {
    qb.andWhere("vehicle.mileage >= :since_mileage", {
      since_mileage: filters.since_mileage,
    });
  }

  if (is_finite_number(filters.until_mileage)) {
    qb.andWhere("vehicle.mileage <= :until_mileage", {
      until_mileage: filters.until_mileage,
    });
  }

  if (has_non_empty_string_array(filters.transmission_types)) {
    qb.andWhere(
      "vehicle.transmission_type IN (:...transmission_types)",
      { transmission_types: filters.transmission_types },
    );
  }

  if (has_non_empty_string_array(filters.traction_slugs)) {
    qb.andWhere("traction.slug IN (:...traction_slugs)", {
      traction_slugs: filters.traction_slugs,
    });
  }

  if (is_finite_number(filters.power_since)) {
    qb.andWhere("vehicle.power >= :power_since", {
      power_since: filters.power_since,
    });
  }

  if (is_finite_number(filters.power_until)) {
    qb.andWhere("vehicle.power <= :power_until", {
      power_until: filters.power_until,
    });
  }

  if (is_finite_number(filters.displacement_since)) {
    qb.andWhere("vehicle.displacement >= :displacement_since", {
      displacement_since: filters.displacement_since,
    });
  }

  if (is_finite_number(filters.displacement_until)) {
    qb.andWhere("vehicle.displacement <= :displacement_until", {
      displacement_until: filters.displacement_until,
    });
  }

  if (has_non_empty_string_array(filters.dgt_label_ids)) {
    qb.andWhere("vehicle.dgt_label_id IN (:...dgt_label_ids)", {
      dgt_label_ids: filters.dgt_label_ids,
    });
  }

  if (is_finite_number(filters.autonomy_since)) {
    qb.andWhere("vehicle.autonomy >= :autonomy_since", {
      autonomy_since: filters.autonomy_since,
    });
  }

  if (is_finite_number(filters.battery_capacity_since)) {
    qb.andWhere("vehicle.battery_capacity >= :battery_capacity_since", {
      battery_capacity_since: filters.battery_capacity_since,
    });
  }

  if (is_finite_number(filters.battery_capacity_until)) {
    qb.andWhere("vehicle.battery_capacity <= :battery_capacity_until", {
      battery_capacity_until: filters.battery_capacity_until,
    });
  }

  if (is_finite_number(filters.time_to_charge)) {
    qb.andWhere("vehicle.time_to_charge >= :time_to_charge", {
      time_to_charge: filters.time_to_charge,
    });
  }

  if (has_non_empty_string_array(filters.features_slugs)) {
    qb.andWhere(
      `(SELECT COUNT(DISTINCT f_feat.slug) FROM vehicle_features vf_feat
        INNER JOIN features f_feat ON f_feat.id = vf_feat."featuresId"
        WHERE vf_feat."vehiclesId" = vehicle.id
          AND f_feat.slug IN (:...features_slugs)) = :features_slugs_match_count`,
      {
        features_slugs: filters.features_slugs,
        features_slugs_match_count: filters.features_slugs.length,
      },
    );
  }

  if (has_non_empty_string_array(filters.color_slugs)) {
    qb.andWhere("color.slug IN (:...color_slugs)", {
      color_slugs: filters.color_slugs,
    });
  }

  if (has_non_empty_string_array(filters.cuota_slugs)) {
    qb.andWhere(
      `EXISTS (
        SELECT 1 FROM vehicle_cuotas vc
        INNER JOIN cuotas c ON c.id = vc.cuota_id
        WHERE vc.vehicle_id = vehicle.id AND c.slug IN (:...cuota_slugs)
      )`,
      { cuota_slugs: filters.cuota_slugs },
    );
  }
  if (has_non_empty_string(filters.query)) {
    qb.andWhere("(vehicle.title ILIKE :search OR vehicle.description ILIKE :search)", {
      search: `%${filters.query.trim()}%`,
    });
  }

  if (has_non_empty_string(filters.condition)) {
    qb.andWhere("vehicle.condition = :vehicle_condition", {
      vehicle_condition: filters.condition,
    });
  }

  if (has_non_empty_string(filters.status)) {
    qb.andWhere("vehicle.status = :vehicle_status", {
      vehicle_status: filters.status,
    });
  }

  if (
    Array.isArray(filters.exclude_vehicle_ids) &&
    filters.exclude_vehicle_ids.length > 0
  ) {
    qb.andWhere("vehicle.id NOT IN (:...exclude_vehicle_ids)", {
      exclude_vehicle_ids: filters.exclude_vehicle_ids,
    });
  }
};

export const applyAdminFilters = (
  qb: SelectQueryBuilder<VehicleEntity>,
  filters: AdminVehicleFilter,
): void => {
  if (has_non_empty_string(filters.query)) {
    qb.andWhere(
      "(vehicle.title ILIKE :admin_search OR vehicle.description ILIKE :admin_search)",
      { admin_search: `%${filters.query.trim()}%` },
    );
  }

  if (has_non_empty_string(filters.publisher_name)) {
    const publisher_name = `%${filters.publisher_name.trim()}%`;
    qb.andWhere(
      `(profile.name ILIKE :publisher_name OR profile.last_name ILIKE :publisher_name OR CONCAT(profile.name, ' ', COALESCE(profile.last_name, '')) ILIKE :publisher_name)`,
      { publisher_name },
    );
  }

  if (has_non_empty_string(filters.publisher_email)) {
    qb.andWhere(
      "vehicle.email = :publisher_email",
      { publisher_email: filters.publisher_email.trim() },
    );
  }

  if (filters.status) {
    qb.andWhere("vehicle.status = :admin_status", {
      admin_status: filters.status,
    });
  }

  if (is_valid_date(filters.since_created_at)) {
    qb.andWhere("vehicle.created_at >= :since_created_at", {
      since_created_at: filters.since_created_at,
    });
  }

  if (is_valid_date(filters.until_created_at)) {
    qb.andWhere("vehicle.created_at <= :until_created_at", {
      until_created_at: filters.until_created_at,
    });
  }

  if (is_valid_date(filters.since_updated_at)) {
    qb.andWhere("vehicle.updated_at >= :since_updated_at", {
      since_updated_at: filters.since_updated_at,
    });
  }

  if (is_valid_date(filters.until_updated_at)) {
    qb.andWhere("vehicle.updated_at <= :until_updated_at", {
      until_updated_at: filters.until_updated_at,
    });
  }

  if (is_valid_date(filters.since_expires_at)) {
    qb.andWhere("vehicle.expires_at >= :since_expires_at", {
      since_expires_at: filters.since_expires_at,
    });
  }

  if (is_valid_date(filters.until_expires_at)) {
    qb.andWhere("vehicle.expires_at <= :until_expires_at", {
      until_expires_at: filters.until_expires_at,
    });
  }

  if (typeof filters.is_featured === "boolean") {
    qb.andWhere("vehicle.is_featured = :admin_is_featured", {
      admin_is_featured: filters.is_featured,
    });
  }

  if (filters.publisher_type) {
    qb.andWhere("vehicle.publisher_type = :admin_publisher_type", {
      admin_publisher_type: filters.publisher_type,
    });
  }

  if (has_non_empty_string(filters.vehicle_type_id)) {
    qb.andWhere("vehicle.vehicle_type_id = :vehicle_type_id", {
      vehicle_type_id: filters.vehicle_type_id.trim(),
    });
  }
};

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import {
  STATUS_VEHICLE,
  type ConditionVehicle,
  type StatusVehicle,
  type TransmissionType,
} from "../types/vehicle";
import type { VehicleAddressDetails } from "../types/vehicle-address-details";
import { SEGMENT_SCOPE, type SegmentScope } from "../types/vehicle-insights";
import { VEHICLE_PRICE_STATUS } from "../vehicle-prices/types/vehicle-price";

/** Edad mínima (días) para que un anuncio aporte tasas al segmento. */
export const SEGMENT_MIN_LISTING_AGE_DAYS = 7;

export interface VehicleInsightsSubject {
  id: string;
  status: StatusVehicle;
  profile_id: string | null;
  description: string | null;
  mileage: number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  lat: number;
  lng: number;
  color_id: string | null;
  category_id: string | null;
  dgt_label_id: string | null;
  version_id: number;
  address_details: VehicleAddressDetails | null;
  is_featured: boolean;
  featured_expires_at: Date | null;
  price: number;
  images_count: number;
  features_count: number;
  make_id: number;
  make_name: string;
  model_id: number;
  model_name: string;
  version_name: string;
  year: number | null;
  listing_age_days: number;
}

export interface VehicleFunnelCounts {
  views: number;
  contact_clicks: number;
  leads: number;
  chats: number;
}

export interface VehicleSegmentBenchmarks {
  scope: SegmentScope;
  scope_id: number;
  window_days: number;
  sample_count: number;
  median_photos: number | null;
  views_daily_rate: number;
  contact_clicks_daily_rate: number;
  leads_daily_rate: number;
  chats_daily_rate: number;
}

/** Campos mínimos para calcular health en la lista de Mis Anuncios. */
export interface VehicleHealthInputRow {
  id: string;
  description: string | null;
  price: number;
  mileage: number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  lat: number;
  lng: number;
  color_id: string | null;
  category_id: string | null;
  dgt_label_id: string | null;
  version_id: number;
  images_count: number;
  features_count: number;
}

interface SubjectRow {
  id: string;
  status: StatusVehicle;
  profile_id: string | null;
  description: string | null;
  mileage: string | number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  lat: string | number;
  lng: string | number;
  color_id: string | null;
  category_id: string | null;
  dgt_label_id: string | null;
  version_id: string | number;
  address_details: VehicleAddressDetails | null;
  is_featured: boolean;
  featured_expires_at: Date | null;
  price: string | number | null;
  images_count: string | number;
  features_count: string | number;
  make_id: string | number;
  make_name: string;
  model_id: string | number;
  model_name: string;
  version_name: string;
  year: string | number | null;
  listing_age_days: string | number;
}

interface FunnelRow {
  views: string | number;
  contact_clicks: string | number;
  leads: string | number;
  chats: string | number;
}

interface SegmentRow {
  sample_count: string | number;
  median_photos: string | number | null;
  views_daily_rate: string | number | null;
  contact_clicks_daily_rate: string | number | null;
  leads_daily_rate: string | number | null;
  chats_daily_rate: string | number | null;
}

interface HealthInputRow {
  id: string;
  description: string | null;
  price: string | number | null;
  mileage: string | number;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  lat: string | number;
  lng: string | number;
  color_id: string | null;
  category_id: string | null;
  dgt_label_id: string | null;
  version_id: string | number;
  images_count: string | number;
  features_count: string | number;
}

const SEGMENT_SCOPE_COLUMN: Record<SegmentScope, string> = {
  [SEGMENT_SCOPE.MODEL]: "ver.model_id",
  [SEGMENT_SCOPE.MAKE]: "ver.make_id",
};

const to_number = (value: string | number | null | undefined): number =>
  Number(value ?? 0);

const to_nullable_number = (
  value: string | number | null | undefined,
): number | null => (value === null || value === undefined ? null : Number(value));

/**
 * Lecturas de solo lectura para insights del vendedor (precio, calidad, embudo).
 * SQL crudo como el resto de repositorios de analítica (owner-dashboard).
 */
@Injectable()
export class TypeOrmVehicleInsightsRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async findSubject(
    vehicle_id: string,
    now: Date = new Date(),
  ): Promise<VehicleInsightsSubject | null> {
    const rows = await this.data_source.query<SubjectRow[]>(
      `
        SELECT
          v.id,
          v.status,
          v.profile_id,
          v.description,
          v.mileage,
          v.condition,
          v.transmission_type,
          v.lat,
          v.lng,
          v.color_id,
          v.category_id,
          v.dgt_label_id,
          v.version_id,
          v.address_details,
          v.is_featured,
          v.featured_expires_at,
          COALESCE(vp.price, 0)::int AS price,
          (
            SELECT COUNT(*)::int
            FROM vehicle_images vi
            WHERE vi.vehicle_id = v.id
          ) AS images_count,
          (
            SELECT COUNT(*)::int
            FROM vehicle_features vf
            WHERE vf."vehiclesId" = v.id
          ) AS features_count,
          make.id AS make_id,
          make.name AS make_name,
          model.id AS model_id,
          model.name AS model_name,
          ver.name AS version_name,
          yr.year AS year,
          EXTRACT(
            EPOCH FROM (
              $3::timestamptz - GREATEST(COALESCE(v.renewed_at, v.created_at), v.created_at)
            )
          ) / 86400 AS listing_age_days
        FROM vehicles v
        INNER JOIN version ver ON ver.id = v.version_id
        INNER JOIN make ON make.id = ver.make_id
        INNER JOIN model ON model.id = ver.model_id
        LEFT JOIN "year" yr ON yr.id = ver.year_id
        LEFT JOIN LATERAL (
          SELECT p.price
          FROM vehicle_prices p
          WHERE p.vehicle_id = v.id
            AND p.status = $2
          ORDER BY p.created_at DESC
          LIMIT 1
        ) vp ON TRUE
        WHERE v.id = $1
          AND v.deleted_at IS NULL
        LIMIT 1
      `,
      [vehicle_id, VEHICLE_PRICE_STATUS.ACTIVE, now],
    );

    const row = rows.at(0);
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      profile_id: row.profile_id,
      description: row.description,
      mileage: to_number(row.mileage),
      condition: row.condition,
      transmission_type: row.transmission_type,
      lat: to_number(row.lat),
      lng: to_number(row.lng),
      color_id: row.color_id,
      category_id: row.category_id,
      dgt_label_id: row.dgt_label_id,
      version_id: to_number(row.version_id),
      address_details: row.address_details,
      is_featured: Boolean(row.is_featured),
      featured_expires_at: row.featured_expires_at,
      price: to_number(row.price),
      images_count: to_number(row.images_count),
      features_count: to_number(row.features_count),
      make_id: to_number(row.make_id),
      make_name: row.make_name,
      model_id: to_number(row.model_id),
      model_name: row.model_name,
      version_name: row.version_name,
      year: to_nullable_number(row.year),
      listing_age_days: Math.max(0, to_number(row.listing_age_days)),
    };
  }

  async getFunnelCounts(
    vehicle_id: string,
    window_start: Date,
  ): Promise<VehicleFunnelCounts> {
    const rows = await this.data_source.query<FunnelRow[]>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM vehicle_views vv
            WHERE vv.vehicle_id = $1
              AND vv.created_at >= $2
          ) AS views,
          (
            SELECT COUNT(*)::int
            FROM vehicle_contact_clicks cc
            WHERE cc.vehicle_id = $1
              AND cc.created_at >= $2
          ) AS contact_clicks,
          (
            SELECT COUNT(*)::int
            FROM leads l
            WHERE l.vehicle_id = $1
              AND l.created_at >= $2
          ) AS leads,
          (
            SELECT COUNT(*)::int
            FROM chats c
            WHERE c.vehicle_id = $1
              AND c.created_at >= $2
          ) AS chats
      `,
      [vehicle_id, window_start],
    );

    const row = rows[0];
    return {
      views: to_number(row.views),
      contact_clicks: to_number(row.contact_clicks),
      leads: to_number(row.leads),
      chats: to_number(row.chats),
    };
  }

  /**
   * Mediana (por anuncio) de las tasas diarias del embudo en anuncios activos del
   * segmento con edad >= 7 días. Cada anuncio usa su ventana min(window_days, edad).
   * También devuelve la mediana de fotos. El fallback modelo → marca lo decide el servicio.
   */
  async getSegmentBenchmarks(params: {
    scope: SegmentScope;
    scope_id: number;
    window_days: number;
    now?: Date;
  }): Promise<VehicleSegmentBenchmarks> {
    const scope_column = SEGMENT_SCOPE_COLUMN[params.scope];
    const now = params.now ?? new Date();

    const rows = await this.data_source.query<SegmentRow[]>(
      `
        WITH segment AS (
          SELECT
            v.id,
            LEAST(
              $2::float8,
              EXTRACT(
                EPOCH FROM (
                  $3::timestamptz - GREATEST(COALESCE(v.renewed_at, v.created_at), v.created_at)
                )
              ) / 86400
            ) AS window_days
          FROM vehicles v
          INNER JOIN version ver ON ver.id = v.version_id
          WHERE ${scope_column} = $1
            AND v.status = $4
            AND v.deleted_at IS NULL
            AND GREATEST(COALESCE(v.renewed_at, v.created_at), v.created_at)
              <= $3::timestamptz - make_interval(days => $5::int)
        ),
        per_listing AS (
          SELECT
            s.id,
            (
              SELECT COUNT(*)
              FROM vehicle_images vi
              WHERE vi.vehicle_id = s.id
            ) AS photos,
            (
              SELECT COUNT(*)
              FROM vehicle_views vv
              WHERE vv.vehicle_id = s.id
                AND vv.created_at >= $3::timestamptz - make_interval(secs => s.window_days * 86400)
            ) / s.window_days AS views_rate,
            (
              SELECT COUNT(*)
              FROM vehicle_contact_clicks cc
              WHERE cc.vehicle_id = s.id
                AND cc.created_at >= $3::timestamptz - make_interval(secs => s.window_days * 86400)
            ) / s.window_days AS contact_clicks_rate,
            (
              SELECT COUNT(*)
              FROM leads l
              WHERE l.vehicle_id = s.id
                AND l.created_at >= $3::timestamptz - make_interval(secs => s.window_days * 86400)
            ) / s.window_days AS leads_rate,
            (
              SELECT COUNT(*)
              FROM chats c
              WHERE c.vehicle_id = s.id
                AND c.created_at >= $3::timestamptz - make_interval(secs => s.window_days * 86400)
            ) / s.window_days AS chats_rate
          FROM segment s
          WHERE s.window_days > 0
        )
        SELECT
          COUNT(*)::int AS sample_count,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY photos) AS median_photos,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY views_rate) AS views_daily_rate,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY contact_clicks_rate) AS contact_clicks_daily_rate,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY leads_rate) AS leads_daily_rate,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY chats_rate) AS chats_daily_rate
        FROM per_listing
      `,
      [
        params.scope_id,
        params.window_days,
        now,
        STATUS_VEHICLE.ACTIVE,
        SEGMENT_MIN_LISTING_AGE_DAYS],
    );

    const row = rows[0];
    return {
      scope: params.scope,
      scope_id: params.scope_id,
      window_days: params.window_days,
      sample_count: to_number(row.sample_count),
      median_photos: to_nullable_number(row.median_photos),
      views_daily_rate: to_number(row.views_daily_rate),
      contact_clicks_daily_rate: to_number(row.contact_clicks_daily_rate),
      leads_daily_rate: to_number(row.leads_daily_rate),
      chats_daily_rate: to_number(row.chats_daily_rate),
    };
  }

  /**
   * Una sola query batch con los campos que necesita el health de Mis Anuncios
   * (incluye counts de imágenes y features), para no depender de la entidad cargada.
   */
  async findHealthInputsByVehicleIds(
    vehicle_ids: string[],
  ): Promise<VehicleHealthInputRow[]> {
    if (vehicle_ids.length === 0) {
      return [];
    }

    const rows = await this.data_source.query<HealthInputRow[]>(
      `
        SELECT
          v.id,
          v.description,
          COALESCE(vp.price, 0)::int AS price,
          v.mileage,
          v.condition,
          v.transmission_type,
          v.lat,
          v.lng,
          v.color_id,
          v.category_id,
          v.dgt_label_id,
          v.version_id,
          COALESCE(img.count, 0)::int AS images_count,
          COALESCE(feat.count, 0)::int AS features_count
        FROM vehicles v
        LEFT JOIN LATERAL (
          SELECT p.price
          FROM vehicle_prices p
          WHERE p.vehicle_id = v.id
            AND p.status = $2
          ORDER BY p.created_at DESC
          LIMIT 1
        ) vp ON TRUE
        LEFT JOIN (
          SELECT vi.vehicle_id, COUNT(*) AS count
          FROM vehicle_images vi
          WHERE vi.vehicle_id = ANY($1::uuid[])
          GROUP BY vi.vehicle_id
        ) img ON img.vehicle_id = v.id
        LEFT JOIN (
          SELECT vf."vehiclesId" AS vehicle_id, COUNT(*) AS count
          FROM vehicle_features vf
          WHERE vf."vehiclesId" = ANY($1::uuid[])
          GROUP BY vf."vehiclesId"
        ) feat ON feat.vehicle_id = v.id
        WHERE v.id = ANY($1::uuid[])
          AND v.deleted_at IS NULL
      `,
      [vehicle_ids, VEHICLE_PRICE_STATUS.ACTIVE],
    );

    return rows.map((row) => ({
      id: row.id,
      description: row.description,
      price: to_number(row.price),
      mileage: to_number(row.mileage),
      condition: row.condition,
      transmission_type: row.transmission_type,
      lat: to_number(row.lat),
      lng: to_number(row.lng),
      color_id: row.color_id,
      category_id: row.category_id,
      dgt_label_id: row.dgt_label_id,
      version_id: to_number(row.version_id),
      images_count: to_number(row.images_count),
      features_count: to_number(row.features_count),
    }));
  }
}

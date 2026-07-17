import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import {
  PublishedVehicleSnapshot,
  PublishedVehicleSnapshotPort,
} from "../ports/published-vehicle-snapshot.port";
import {
  ConditionVehicle,
  PublisherType,
  TransmissionType,
} from "../types/vehicle";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";

interface SnapshotRow {
  vehicle_id: string;
  profile_id: string;
  make_name: string;
  model_name: string;
  version_name: string;
  cover_image_url: string | null;
  mileage: number;
  lat: string;
  lng: string;
  condition: ConditionVehicle;
  transmission_type: TransmissionType;
  publisher_type: PublisherType;
  is_featured: boolean;
  featured_expires_at: Date | null;
  make_slug: string;
  model_slug: string;
  year: number;
  fuel_type_slug: string;
  traction_slug: string;
  type_slug: string | null;
  color_slug: string | null;
  warranty_slug: string | null;
  dgt_label_id: string | null;
  power: number;
  displacement: number;
  autonomy: number;
  battery_capacity: number;
  time_to_charge: number;
  active_price: string | null;
  feature_slugs: string[] | null;
  service_slugs: string[] | null;
  cuota_slugs: string[] | null;
}

interface LocationRow {
  slug: string;
}

@Injectable()
export class PublishedVehicleSnapshotService extends PublishedVehicleSnapshotPort {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {
    super();
  }

  async buildForVehicleId(
    vehicle_id: string,
  ): Promise<PublishedVehicleSnapshot | null> {
    const rows = await this.data_source.query<SnapshotRow[]>(
      `
      SELECT
        v.id AS vehicle_id,
        v.profile_id AS profile_id,
        mk.name AS make_name,
        md.name AS model_name,
        ver.name AS version_name,
        (
          SELECT vi.url
          FROM vehicle_images vi
          WHERE vi.vehicle_id = v.id
          ORDER BY vi.created_at ASC
          LIMIT 1
        ) AS cover_image_url,
        v.mileage AS mileage,
        v.lat AS lat,
        v.lng AS lng,
        v.condition AS condition,
        v.transmission_type AS transmission_type,
        v.publisher_type AS publisher_type,
        v.is_featured AS is_featured,
        v.featured_expires_at AS featured_expires_at,
        mk.slug AS make_slug,
        md.slug AS model_slug,
        yr.year AS year,
        ft.slug AS fuel_type_slug,
        tr.slug AS traction_slug,
        vt.slug AS type_slug,
        col.slug AS color_slug,
        wt.slug AS warranty_slug,
        v.dgt_label_id AS dgt_label_id,
        v.power AS power,
        v.displacement AS displacement,
        v.autonomy AS autonomy,
        v.battery_capacity AS battery_capacity,
        v.time_to_charge AS time_to_charge,
        vp.price AS active_price,
        COALESCE(
          (
            SELECT array_agg(DISTINCT f.slug)
            FROM vehicle_features vf
            INNER JOIN features f ON f.id = vf."featuresId"
            WHERE vf."vehiclesId" = v.id
          ),
          ARRAY[]::text[]
        ) AS feature_slugs,
        COALESCE(
          (
            SELECT array_agg(DISTINCT s.slug)
            FROM vehicle_services vs
            INNER JOIN services s ON s.id = vs."servicesId"
            WHERE vs."vehiclesId" = v.id
          ),
          ARRAY[]::text[]
        ) AS service_slugs,
        COALESCE(
          (
            SELECT array_agg(DISTINCT c.slug)
            FROM vehicle_cuotas vc
            INNER JOIN cuotas c ON c.id = vc.cuota_id
            WHERE vc.vehicle_id = v.id
          ),
          ARRAY[]::text[]
        ) AS cuota_slugs
      FROM vehicles v
      INNER JOIN version ver ON ver.id = v.version_id
      INNER JOIN make mk ON mk.id = ver.make_id
      INNER JOIN model md ON md.id = ver.model_id
      INNER JOIN year yr ON yr.id = ver.year_id
      INNER JOIN fuel_type ft ON ft.id = ver.fuel_type_id
      INNER JOIN tractions tr ON tr.id = v.traction_id
      LEFT JOIN vehicle_types vt ON vt.id = v.vehicle_type_id
      LEFT JOIN colors col ON col.id = v.color_id
      LEFT JOIN warranty_types wt ON wt.id = v.warranty_type_id
      LEFT JOIN vehicle_prices vp
        ON vp.vehicle_id = v.id AND vp.status = 'active'
      WHERE v.id = $1
      LIMIT 1
      `,
      [vehicle_id],
    );

    const row = rows[0];
    if (!row) {
      return null;
    }

    const [province_slugs, municipalities_slugs, comunities_slugs] =
      await Promise.all([
        this.resolve_location_slugs("provinces", row.lng, row.lat),
        this.resolve_location_slugs("municipalities", row.lng, row.lat),
        this.resolve_location_slugs("communities", row.lng, row.lat),
      ]);

    const featured_expires_at = row.featured_expires_at
      ? new Date(row.featured_expires_at)
      : null;
    const is_featured_active =
      row.is_featured &&
      (!featured_expires_at || featured_expires_at.getTime() > Date.now());

    return {
      vehicle_id: row.vehicle_id,
      profile_id: row.profile_id,
      vehicle_label: formatVehicleDisplayName({
        make_name: row.make_name,
        model_name: row.model_name,
        version_name: row.version_name,
      }),
      cover_image_url: row.cover_image_url,
      price: row.active_price ? Number(row.active_price) : 0,
      mileage: Number(row.mileage),
      lat: Number(row.lat),
      lng: Number(row.lng),
      condition: row.condition,
      transmission_type: row.transmission_type,
      publisher_type: row.publisher_type,
      is_featured: is_featured_active,
      featured_expires_at,
      make_slug: row.make_slug,
      model_slug: row.model_slug,
      year: Number(row.year),
      fuel_type_slug: row.fuel_type_slug,
      traction_slug: row.traction_slug,
      type_slug: row.type_slug,
      color_slug: row.color_slug,
      warranty_slug: row.warranty_slug,
      dgt_label_id: row.dgt_label_id,
      feature_slugs: row.feature_slugs ?? [],
      service_slugs: row.service_slugs ?? [],
      cuota_slugs: row.cuota_slugs ?? [],
      province_slugs,
      municipalities_slugs,
      comunities_slugs,
      power: Number(row.power),
      displacement: Number(row.displacement),
      autonomy: Number(row.autonomy),
      battery_capacity: Number(row.battery_capacity),
      time_to_charge: Number(row.time_to_charge),
    };
  }

  private async resolve_location_slugs(
    table: "provinces" | "municipalities" | "communities",
    lng: string,
    lat: string,
  ): Promise<string[]> {
    const rows = await this.data_source.query<LocationRow[]>(
      `
      SELECT loc.slug AS slug
      FROM ${table} loc
      WHERE ST_Intersects(
        ST_SetSRID(ST_MakePoint(CAST($1 AS double precision), CAST($2 AS double precision)), 4326),
        loc.geom
      )
      `,
      [lng, lat],
    );

    return rows.map((row) => row.slug);
  }
}

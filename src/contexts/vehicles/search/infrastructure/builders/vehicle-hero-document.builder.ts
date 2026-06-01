import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { STATUS_VEHICLE } from "../../../domain/entities/vehicle";
import type { VehicleHeroSearchDocument } from "../../domain/entities/vehicle-hero-search-document";

interface VehicleRow {
  vehicle_id: string;
  status: string;
  deleted_at: Date | null;
  lat: string;
  lng: string;
  make_id: number;
  make_slug: string;
  make_name: string;
  model_id: number;
  model_slug: string;
  model_name: string;
  active_price: string | null;
};

interface LocationRow {
  id: number;
  slug: string;
  name: string;
};

@Injectable()
export class VehicleHeroDocumentBuilder {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async buildForVehicleId(
    vehicle_id: string,
  ): Promise<VehicleHeroSearchDocument | null> {
    const rows = await this.data_source.query<VehicleRow[]>(
      `
      SELECT
        v.id AS vehicle_id,
        v.status AS status,
        v.deleted_at AS deleted_at,
        v.lat AS lat,
        v.lng AS lng,
        mk.id AS make_id,
        mk.slug AS make_slug,
        mk.name AS make_name,
        md.id AS model_id,
        md.slug AS model_slug,
        md.name AS model_name,
        vp.price AS active_price
      FROM vehicles v
      INNER JOIN version ver ON ver.id = v.version_id
      INNER JOIN make mk ON mk.id = ver.make_id
      INNER JOIN model md ON md.id = ver.model_id
      LEFT JOIN vehicle_prices vp
        ON vp.vehicle_id = v.id AND vp.status = 'active'
      WHERE v.id = $1
      LIMIT 1
      `,
      [vehicle_id],
    );

    const row = rows[0];

    const province = await this.resolveProvince(row.lng, row.lat);
    const municipality = await this.resolveMunicipality(row.lng, row.lat);

    const lat = Number(row.lat);
    const lng = Number(row.lng);

    return {
      vehicle_id: row.vehicle_id,
      status: row.status,
      deleted_at: row.deleted_at ? row.deleted_at.toISOString() : null,
      make_id: Number(row.make_id),
      make_slug: row.make_slug,
      make_name: row.make_name,
      model_id: Number(row.model_id),
      model_slug: row.model_slug,
      model_name: row.model_name,
      province_id: province?.id ?? null,
      province_slug: province?.slug ?? null,
      province_name: province?.name ?? null,
      municipality_id: municipality?.id ?? null,
      municipality_slug: municipality?.slug ?? null,
      municipality_name: municipality?.name ?? null,
      active_price:
        row.active_price
          ? Number(row.active_price)
          : null,
      location:
        Number.isFinite(lat) && Number.isFinite(lng)
          ? { lat, lon: lng }
          : null,
    };
  }

  async buildAllIndexable(): Promise<VehicleHeroSearchDocument[]> {
    const rows = await this.data_source.query<VehicleRow[]>(
      `
      SELECT
        v.id AS vehicle_id,
        v.status AS status,
        v.deleted_at AS deleted_at,
        v.lat AS lat,
        v.lng AS lng,
        mk.id AS make_id,
        mk.slug AS make_slug,
        mk.name AS make_name,
        md.id AS model_id,
        md.slug AS model_slug,
        md.name AS model_name,
        vp.price AS active_price
      FROM vehicles v
      INNER JOIN version ver ON ver.id = v.version_id
      INNER JOIN make mk ON mk.id = ver.make_id
      INNER JOIN model md ON md.id = ver.model_id
      LEFT JOIN vehicle_prices vp
        ON vp.vehicle_id = v.id AND vp.status = 'active'
      WHERE v.status = $1
        AND v.deleted_at IS NULL
      `,
      [STATUS_VEHICLE.ACTIVE],
    );

    const documents: VehicleHeroSearchDocument[] = [];

    for (const row of rows) {
      const province = await this.resolveProvince(row.lng, row.lat);
      const municipality = await this.resolveMunicipality(row.lng, row.lat);
      const lat = Number(row.lat);
      const lng = Number(row.lng);

      documents.push({
        vehicle_id: row.vehicle_id,
        status: row.status,
        deleted_at: null,
        make_id: Number(row.make_id),
        make_slug: row.make_slug,
        make_name: row.make_name,
        model_id: Number(row.model_id),
        model_slug: row.model_slug,
        model_name: row.model_name,
        province_id: province?.id ?? null,
        province_slug: province?.slug ?? null,
        province_name: province?.name ?? null,
        municipality_id: municipality?.id ?? null,
        municipality_slug: municipality?.slug ?? null,
        municipality_name: municipality?.name ?? null,
        active_price:
          row.active_price
            ? Number(row.active_price)
            : null,
        location:
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat, lon: lng }
            : null,
      });
    }

    return documents;
  }

  private async resolveProvince(
    lng: string,
    lat: string,
  ): Promise<LocationRow | null> {
    const resolved = await this.data_source.query<LocationRow[]>(
      `
      SELECT p.id, p.slug, p.name
      FROM provinces p
      WHERE ST_Intersects(
        ST_SetSRID(ST_MakePoint(CAST($1 AS double precision), CAST($2 AS double precision)), 4326),
        p.geom
      )
      ORDER BY ST_Area(p.geom) ASC
      LIMIT 1
      `,
      [lng, lat],
    );

    return resolved[0] ?? null;
  }

  private async resolveMunicipality(
    lng: string,
    lat: string,
  ): Promise<LocationRow | null> {
    const resolved = await this.data_source.query<LocationRow[]>(
      `
      SELECT m.id, m.slug, COALESCE(m.name, m.slug) AS name
      FROM municipalities m
      WHERE ST_Intersects(
        ST_SetSRID(ST_MakePoint(CAST($1 AS double precision), CAST($2 AS double precision)), 4326),
        m.geom
      )
      ORDER BY ST_Area(m.geom) ASC
      LIMIT 1
      `,
      [lng, lat],
    );

    return resolved[0] ?? null;
  }
}

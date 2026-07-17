import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import type { PostgisLocationNames } from "./format-vehicle-address";

interface LocationRow {
  name: string;
}

@Injectable()
export class PostgisLocationResolver {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async resolve(lng: number, lat: number): Promise<PostgisLocationNames> {
    const [province, municipality] = await Promise.all([
      this.resolveProvince(lng, lat),
      this.resolveMunicipality(lng, lat),
    ]);

    return {
      province: province?.name ?? null,
      municipality: municipality?.name ?? null,
    };
  }

  private async resolveProvince(
    lng: number,
    lat: number,
  ): Promise<LocationRow | null> {
    const resolved = await this.data_source.query<LocationRow[]>(
      `
      SELECT p.name
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
    lng: number,
    lat: number,
  ): Promise<LocationRow | null> {
    const resolved = await this.data_source.query<LocationRow[]>(
      `
      SELECT COALESCE(m.name, m.slug) AS name
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

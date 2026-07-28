import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@Injectable()
export class TypeOrmImpressionRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async recordBatch(
    vehicle_ids: string[],
    profile_id: string | null,
  ): Promise<number> {
    if (vehicle_ids.length === 0) {
      return 0;
    }

    const rows = await this.data_source.query<{ id: string }[]>(
      `
        INSERT INTO vehicle_impressions (id, vehicle_id, profile_id, created_at)
        SELECT uuid_generate_v4(), v.id, $2, now()
        FROM vehicles v
        WHERE v.id = ANY($1::uuid[])
          AND v.deleted_at IS NULL
        RETURNING id
      `,
      [vehicle_ids, profile_id],
    );

    return rows.length;
  }
}

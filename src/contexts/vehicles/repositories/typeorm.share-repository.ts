import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { Share } from "../types/share";
import { ShareEntity } from "../entities/share.entity";
import { VehicleEntity } from "../entities/vehicle.entity";

@Injectable()
export class TypeOrmShareRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async record(share: Share): Promise<void> {
    const primitive = share.toPrimitives();

    await this.data_source.transaction(async (manager) => {
      await manager.save(
        manager.create(ShareEntity, {
          id: primitive.id,
          vehicle_id: primitive.vehicle_id,
          profile_id: primitive.profile_id,
          platform: primitive.platform,
          source: primitive.source,
          created_at: primitive.created_at,
        }),
      );
      await manager.increment(
        VehicleEntity,
        { id: primitive.vehicle_id },
        "shares",
        1,
      );
    });
  }
}

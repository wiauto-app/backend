import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { View } from "../../domain/entities/view";
import { ViewRepository } from "../../domain/repositories/view.repository";
import { VehicleEntity } from "../persistence/vehicle.entity";
import { ViewEntity } from "../persistence/view.entity";

@Injectable()
export class TypeOrmViewRepository implements ViewRepository {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
  ) {}

  async record(view: View): Promise<void> {
    const primitive = view.toPrimitives();

    await this.data_source.transaction(async (manager) => {
      await manager.save(
        manager.create(ViewEntity, {
          id: primitive.id,
          vehicle_id: primitive.vehicle_id,
          profile_id: primitive.profile_id,
          ip_hash: primitive.ip_hash,
          user_agent: primitive.user_agent,
          referer: primitive.referer,
          metadata: primitive.metadata,
          created_at: primitive.created_at,
        }),
      );
      await manager.increment(
        VehicleEntity,
        { id: primitive.vehicle_id },
        "views",
        1,
      );
    });
  }
}

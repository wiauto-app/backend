import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AlertFavoriteProfileLookupPort } from "../../application/ports/alert-event-recipient.port";
import { VehicleListItemEntity } from "@/src/contexts/vehicles/infrastructure/persistence/vehicle-list-item.entity";

@Injectable()
export class TypeOrmAlertFavoriteProfileLookupAdapter extends AlertFavoriteProfileLookupPort {
  constructor(
    @InjectRepository(VehicleListItemEntity)
    private readonly vehicle_list_item_repository: Repository<VehicleListItemEntity>,
  ) {
    super();
  }

  async findProfileIdsByVehicleId(
    vehicle_id: string,
    exclude_profile_id?: string,
  ): Promise<string[]> {
    const query = this.vehicle_list_item_repository
      .createQueryBuilder("item")
      .innerJoin("item.vehicle_list", "list")
      .select("DISTINCT list.profile_id", "profile_id")
      .where("item.vehicle_id = :vehicle_id", { vehicle_id });

    if (exclude_profile_id) {
      query.andWhere("list.profile_id != :exclude_profile_id", {
        exclude_profile_id,
      });
    }

    const rows = await query.getRawMany<{ profile_id: string }>();
    return rows.map((row) => row.profile_id);
  }
}

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { OwnerVehicleFilter } from "../../../domain/filters/owner-vehicle.filter";
import { OwnerVehicleListItem } from "../../../domain/read-models/owner-vehicle-list-item";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { FindOwnerVehiclesDto } from "./find-owner-vehicles.dto";

@Injectable()
export class FindOwnerVehiclesUseCase {
  constructor(private readonly vehicle_repository: VehicleRepository) {}

  async execute(
    dto: FindOwnerVehiclesDto,
  ): Promise<PaginatedResult<OwnerVehicleListItem>> {
    const filter = new OwnerVehicleFilter({
      profile_id: dto.profile_id,
      status: dto.status,
      page: dto.page,
      limit: dto.limit,
      order_by: dto.order_by,
      order_direction: dto.order_direction,
    });

    return this.vehicle_repository.findAllByProfileId(filter);
  }
}

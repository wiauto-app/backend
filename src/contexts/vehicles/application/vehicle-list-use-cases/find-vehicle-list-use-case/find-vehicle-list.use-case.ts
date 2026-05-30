import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { VehicleListForbiddenException } from "../../../domain/exceptions/vehicle-list-forbidden.exception";
import { VehicleListNotFoundException } from "../../../domain/exceptions/vehicle-list-not-found.exception";
import { VehicleListDetail } from "../../../domain/read-models/vehicle-list-detail";
import { VehicleListRepository } from "../../../domain/repositories/vehicle-list.repository";
import { FindVehicleListDto } from "./find-vehicle-list.dto";

@Injectable()
export class FindVehicleListUseCase {
  constructor(
    private readonly vehicle_list_repository: VehicleListRepository,
  ) {}

  async execute(dto: FindVehicleListDto): Promise<VehicleListDetail> {
    const detail = await this.vehicle_list_repository.findOneWithDetail(
      dto.list_id,
    );
    if (!detail) {
      throw new VehicleListNotFoundException(dto.list_id);
    }
    if (detail.profile_id !== dto.profile_id) {
      throw new VehicleListForbiddenException();
    }
    return detail;
  }
}

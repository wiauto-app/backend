import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveView, View } from "../../../domain/entities/view";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { ViewRepository } from "../../../domain/repositories/view.repository";
import { RecordVehicleViewDto } from "./record-vehicle-view.dto";

@Injectable()
export class RecordVehicleViewUseCase {
  constructor(
    private readonly view_repository: ViewRepository,
    private readonly vehicle_repository: VehicleRepository,
  ) {}

  async execute(
    dto: RecordVehicleViewDto,
  ): Promise<{ view: PrimitiveView }> {
    const vehicle = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const view = View.create({
      vehicle_id: dto.vehicle_id,
      profile_id: dto.user_id ?? null,
      ip_hash: dto.ip_hash,
      user_agent: dto.user_agent,
      referer: dto.referer,
      metadata: dto.metadata ?? {},
    });

    await this.view_repository.record(view);

    return { view: view.toPrimitives() };
  }
}

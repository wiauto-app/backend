import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveView, View } from "../types/view";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeOrmViewRepository } from "../repositories/typeorm.view-repository";

export interface RecordVehicleViewInput {
  vehicle_id: string;
  user_id: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  referer: string | null;
  metadata: Record<string, unknown>;
}

@Injectable()
export class ViewsService {
  constructor(
    private readonly view_repository: TypeOrmViewRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async record(
    input: RecordVehicleViewInput,
  ): Promise<{ view: PrimitiveView }> {
    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    const view = View.create({
      vehicle_id: input.vehicle_id,
      profile_id: input.user_id ?? null,
      ip_hash: input.ip_hash,
      user_agent: input.user_agent,
      referer: input.referer,
      metadata: input.metadata ?? {},
    });

    await this.view_repository.record(view);

    return { view: view.toPrimitives() };
  }
}

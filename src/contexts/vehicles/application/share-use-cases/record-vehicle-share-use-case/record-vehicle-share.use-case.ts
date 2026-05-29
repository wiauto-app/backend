import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveShare, Share } from "../../../domain/entities/share";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { ShareRepository } from "../../../domain/repositories/share.repository";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { RecordVehicleShareDto } from "./record-vehicle-share.dto";

@Injectable()
export class RecordVehicleShareUseCase {
  constructor(
    private readonly share_repository: ShareRepository,
    private readonly vehicle_repository: VehicleRepository,
  ) {}

  async execute(
    dto: RecordVehicleShareDto,
  ): Promise<{ share: PrimitiveShare }> {
    const vehicle = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const share = Share.create({
      vehicle_id: dto.vehicle_id,
      profile_id: dto.user_id ?? null,
      platform: dto.platform,
      source: dto.source,
    });

    await this.share_repository.save(share);

    return { share: share.toPrimitives() };
  }
}

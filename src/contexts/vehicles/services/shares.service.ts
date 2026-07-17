import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveShare, Share } from "../types/share";
import { VehicleNotFoundException } from "../exceptions/vehicle-not-found.exception";
import { TypeOrmVehicleRepository } from "@/src/contexts/vehicles/repositories/typeorm.vehicle-repository";
import { TypeOrmShareRepository } from "../repositories/typeorm.share-repository";

export interface RecordVehicleShareInput {
  vehicle_id: string;
  user_id: string | null;
  platform: string;
  source: string;
}

@Injectable()
export class SharesService {
  constructor(
    private readonly share_repository: TypeOrmShareRepository,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
  ) {}

  async record(
    input: RecordVehicleShareInput,
  ): Promise<{ share: PrimitiveShare }> {
    const vehicle = await this.vehicle_repository.findOne(input.vehicle_id);
    if (!vehicle) {
      throw new VehicleNotFoundException(input.vehicle_id);
    }

    const share = Share.create({
      vehicle_id: input.vehicle_id,
      profile_id: input.user_id ?? null,
      platform: input.platform,
      source: input.source,
    });

    await this.share_repository.record(share);

    return { share: share.toPrimitives() };
  }
}

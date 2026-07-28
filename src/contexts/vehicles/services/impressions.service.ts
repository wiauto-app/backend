import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { TypeOrmImpressionRepository } from "../repositories/typeorm.impression-repository";

export interface RecordVehicleImpressionsInput {
  vehicle_ids: string[];
  profile_id: string | null;
}

@Injectable()
export class ImpressionsService {
  constructor(
    private readonly impression_repository: TypeOrmImpressionRepository,
  ) {}

  async recordBatch(
    input: RecordVehicleImpressionsInput,
  ): Promise<{ recorded: number }> {
    const unique_vehicle_ids = [...new Set(input.vehicle_ids)];

    const recorded = await this.impression_repository.recordBatch(
      unique_vehicle_ids,
      input.profile_id,
    );

    return { recorded };
  }
}

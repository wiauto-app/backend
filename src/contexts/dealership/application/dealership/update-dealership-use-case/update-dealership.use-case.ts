import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveDealership } from "../../../domain/entities/dealership";
import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";
import { UpdateDealershipPayload } from "../../../domain/payloads/update-dealership.payload";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { UpdateDealershipDto } from "./update-dealership.dto";

@Injectable()
export class UpdateDealershipUseCase {
  constructor(private readonly dealership_repository: DealershipRepository) {}

  async execute(update_dealership_dto: UpdateDealershipDto): Promise<PrimitiveDealership> {
    const { id, ...patch_fields } = update_dealership_dto;
    const dealership = await this.dealership_repository.findOne(id);
    if (!dealership) {
      throw new DealershipNotFoundException(id);
    }
    const payload: UpdateDealershipPayload = { ...patch_fields };
    const updated = dealership.update(payload);
    await this.dealership_repository.update(updated);
    return updated.toPrimitives();
  }
}

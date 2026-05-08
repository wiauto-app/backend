import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveDealership } from "../../../domain/entities/dealership";
import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { FindOneDealershipDto } from "./find-one-dealership.dto";

@Injectable()
export class FindOneDealershipUseCase {
  constructor(private readonly dealership_repository: DealershipRepository) {}

  async execute(
    find_one_dealership_dto: FindOneDealershipDto,
  ): Promise<{ dealership: PrimitiveDealership }> {
    const dealership = await this.dealership_repository.findOne(find_one_dealership_dto.id);
    if (!dealership) {
      throw new DealershipNotFoundException(find_one_dealership_dto.id);
    }
    return { dealership: dealership.toPrimitives() };
  }
}

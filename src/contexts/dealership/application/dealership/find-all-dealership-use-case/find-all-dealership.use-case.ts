import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { PrimitiveDealership } from "../../../domain/entities/dealership";
import { DealershipsFilter } from "../../../domain/filters/dealerships.filter";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { FindAllDealershipDto } from "./find-all-dealership.dto";

@Injectable()
export class FindAllDealershipUseCase {
  constructor(private readonly dealership_repository: DealershipRepository) {}

  async execute(
    find_all_dealership_dto: FindAllDealershipDto,
  ): Promise<PaginatedResult<PrimitiveDealership>> {
    const filter = new DealershipsFilter({ ...find_all_dealership_dto });
    const result = await this.dealership_repository.findAll(filter);
    return result.map((dealership) => dealership.toPrimitives());
  }
}

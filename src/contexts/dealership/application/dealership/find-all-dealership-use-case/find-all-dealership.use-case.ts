import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { DealershipsFilter } from "../../../domain/filters/dealerships.filter";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";
import { DealershipAdminList } from "../../../domain/read-models/dealership-admin-list";

import { FindAllDealershipDto } from "./find-all-dealership.dto";

@Injectable()
export class FindAllDealershipUseCase {
  constructor(private readonly dealership_repository: DealershipRepository) {}

  async execute(
    find_all_dealership_dto: FindAllDealershipDto,
  ): Promise<PaginatedResult<DealershipAdminList>> {
    const filter = new DealershipsFilter({ ...find_all_dealership_dto });
    return this.dealership_repository.findAll(filter);
  }
}

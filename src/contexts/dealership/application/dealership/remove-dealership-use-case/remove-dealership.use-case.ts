import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { RemoveDealershipDto } from "./remove-dealership.dto";

@Injectable()
export class RemoveDealershipUseCase {
  constructor(private readonly dealership_repository: DealershipRepository) {}

  async execute(remove_dealership_dto: RemoveDealershipDto): Promise<void> {
    await this.dealership_repository.delete(remove_dealership_dto.id);
  }
}

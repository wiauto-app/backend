import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipNotFoundException } from "../../../domain/exceptions/dealership-not-found.exception";
import { DealershipDetail } from "../../../domain/read-models/dealership-detail";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";
import { DealershipRepository } from "../../../domain/repositories/dealership.repository";

import { FindOneDealershipDto } from "./find-one-dealership.dto";

@Injectable()
export class FindOneDealershipUseCase {
  constructor(
    private readonly dealership_repository: DealershipRepository,
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(find_one_dealership_dto: FindOneDealershipDto): Promise<DealershipDetail> {
    const dealership = await this.dealership_repository.findOne(find_one_dealership_dto.id);
    if (!dealership) {
      throw new DealershipNotFoundException(find_one_dealership_dto.id);
    }

    const members = await this.dealership_member_repository.findAllByDealershipId(
      find_one_dealership_dto.id,
    );

    return {
      ...dealership.toPrimitives(),
      members,
    };
  }
}

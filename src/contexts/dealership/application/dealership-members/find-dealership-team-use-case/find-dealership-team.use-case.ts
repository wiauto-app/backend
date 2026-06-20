import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberDetail } from "../../../domain/read-models/dealership-detail";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";

import { FindDealershipTeamDto } from "./find-dealership-team.dto";

@Injectable()
export class FindDealershipTeamUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(dto: FindDealershipTeamDto): Promise<DealershipMemberDetail[]> {
    return this.dealership_member_repository.findAllByDealershipId(dto.dealership_id);
  }
}

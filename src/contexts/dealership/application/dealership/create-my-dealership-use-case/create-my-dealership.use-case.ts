import { ConflictException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { PrimitiveDealership } from "../../../domain/entities/dealership";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";
import { CreateDealershipUseCase } from "../create-dealership-use-case/create-dealership.use-case";

import { CreateMyDealershipDto } from "./create-my-dealership.dto";

@Injectable()
export class CreateMyDealershipUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
    private readonly create_dealership_use_case: CreateDealershipUseCase,
  ) {}

  async execute(
    profile_id: string,
    create_my_dealership_dto: CreateMyDealershipDto,
  ): Promise<PrimitiveDealership> {
    const existing_membership =
      await this.dealership_member_repository.findOneByProfileId(profile_id);

    if (existing_membership) {
      throw new ConflictException("Ya perteneces a una concesionaria");
    }

    return this.create_dealership_use_case.execute({
      ...create_my_dealership_dto,
      members: [{ profile_id, role: "owner" }],
    });
  }
}

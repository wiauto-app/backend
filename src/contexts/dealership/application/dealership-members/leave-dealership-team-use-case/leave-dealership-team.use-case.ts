import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberNotFoundException } from "../../../domain/exceptions/dealership-member-not-found.exception";
import { InvalidDealershipMembersException } from "../../../domain/exceptions/invalid-dealership-members.exception";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";

import { LeaveDealershipTeamDto } from "./leave-dealership-team.dto";

@Injectable()
export class LeaveDealershipTeamUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(dto: LeaveDealershipTeamDto): Promise<void> {
    const member =
      await this.dealership_member_repository.findOneByDealershipIdAndProfileId(
        dto.dealership_id,
        dto.profile_id,
      );

    if (!member) {
      throw new DealershipMemberNotFoundException(dto.profile_id);
    }

    const member_primitives = member.toPrimitives();
    if (member_primitives.role !== "member") {
      throw new InvalidDealershipMembersException(
        "Solo los miembros con rol member pueden salir del equipo por esta vía",
      );
    }

    await this.dealership_member_repository.remove(member_primitives.id);
  }
}

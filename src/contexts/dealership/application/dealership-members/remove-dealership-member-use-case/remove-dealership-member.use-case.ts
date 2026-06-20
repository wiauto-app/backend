import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberNotFoundException } from "../../../domain/exceptions/dealership-member-not-found.exception";
import { InvalidDealershipMembersException } from "../../../domain/exceptions/invalid-dealership-members.exception";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";

import { RemoveDealershipMemberDto } from "./remove-dealership-member.dto";

@Injectable()
export class RemoveDealershipMemberUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(dto: RemoveDealershipMemberDto): Promise<void> {
    const member = await this.dealership_member_repository.findOneById(dto.member_id);
    if (!member) {
      throw new DealershipMemberNotFoundException(dto.member_id);
    }

    const member_primitives = member.toPrimitives();
    if (member_primitives.dealership_id !== dto.dealership_id) {
      throw new DealershipMemberNotFoundException(dto.member_id);
    }

    if (member_primitives.role === "owner") {
      const team = await this.dealership_member_repository.findAllByDealershipId(
        dto.dealership_id,
      );
      const owner_count = team.filter((team_member) => team_member.role === "owner").length;
      if (owner_count <= 1) {
        throw new InvalidDealershipMembersException(
          "No se puede eliminar al único propietario del concesionario",
        );
      }
    }

    await this.dealership_member_repository.remove(dto.member_id);
  }
}

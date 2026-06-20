import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberNotFoundException } from "../../../domain/exceptions/dealership-member-not-found.exception";
import { InvalidDealershipMembersException } from "../../../domain/exceptions/invalid-dealership-members.exception";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";

import { UpdateDealershipMemberRoleDto } from "./update-dealership-member-role.dto";

@Injectable()
export class UpdateDealershipMemberRoleUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(dto: UpdateDealershipMemberRoleDto): Promise<void> {
    const member = await this.dealership_member_repository.findOneById(dto.member_id);
    if (!member) {
      throw new DealershipMemberNotFoundException(dto.member_id);
    }

    const member_primitives = member.toPrimitives();
    if (member_primitives.dealership_id !== dto.dealership_id) {
      throw new DealershipMemberNotFoundException(dto.member_id);
    }

    if (member_primitives.role === "owner") {
      throw new InvalidDealershipMembersException(
        "No se puede cambiar el rol del propietario del concesionario",
      );
    }

    const updated_member = member.update({ role: dto.role });
    await this.dealership_member_repository.update(updated_member);
  }
}

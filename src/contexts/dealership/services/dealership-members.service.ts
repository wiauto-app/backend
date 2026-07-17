import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberInputDto } from "../dto/dealership-member-input.dto";
import { DealershipMember } from "../types/dealership-member";
import { DealershipMemberNotFoundException } from "../exceptions/dealership-member-not-found.exception";
import { InvalidDealershipMembersException } from "../exceptions/invalid-dealership-members.exception";
import { ProfileNotFoundForMemberException } from "../exceptions/profile-not-found-for-member.exception";
import { DealershipMemberDetail } from "../types/dealership-detail";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";

export interface CreateDealershipMemberInput {
  dealership_id: string;
  profile_id: string;
  role: "owner" | "admin" | "member";
}

export interface SyncDealershipMembersInput {
  dealership_id: string;
  members: DealershipMemberInputDto[];
}

export interface UpdateDealershipMemberRoleInput {
  dealership_id: string;
  member_id: string;
  role: "admin" | "member";
}

export interface RemoveDealershipMemberInput {
  dealership_id: string;
  member_id: string;
}

export interface LeaveDealershipTeamInput {
  dealership_id: string;
  profile_id: string;
}

@Injectable()
export class DealershipMembersService {
  constructor(
    private readonly dealership_member_repository: TypeOrmDealershipMemberRepository,
    private readonly profile_repository: TypeOrmProfileRepository,
  ) {}

  async create(input: CreateDealershipMemberInput): Promise<void> {
    const dealership_member = DealershipMember.create(input);
    await this.dealership_member_repository.save(dealership_member);
  }

  async findTeam(dealership_id: string): Promise<DealershipMemberDetail[]> {
    return this.dealership_member_repository.findAllByDealershipId(
      dealership_id,
    );
  }

  async updateRole(input: UpdateDealershipMemberRoleInput): Promise<void> {
    const member = await this.dealership_member_repository.findOneById(
      input.member_id,
    );
    if (!member) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    const member_primitives = member.toPrimitives();
    if (member_primitives.dealership_id !== input.dealership_id) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    if (member_primitives.role === "owner") {
      throw new InvalidDealershipMembersException(
        "No se puede cambiar el rol del propietario del concesionario",
      );
    }

    const updated_member = member.update({ role: input.role });
    await this.dealership_member_repository.update(updated_member);
  }

  async removeMember(input: RemoveDealershipMemberInput): Promise<void> {
    const member = await this.dealership_member_repository.findOneById(
      input.member_id,
    );
    if (!member) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    const member_primitives = member.toPrimitives();
    if (member_primitives.dealership_id !== input.dealership_id) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    if (member_primitives.role === "owner") {
      const team =
        await this.dealership_member_repository.findAllByDealershipId(
          input.dealership_id,
        );
      const owner_count = team.filter(
        (team_member) => team_member.role === "owner",
      ).length;
      if (owner_count <= 1) {
        throw new InvalidDealershipMembersException(
          "No se puede eliminar al único propietario del concesionario",
        );
      }
    }

    await this.dealership_member_repository.remove(input.member_id);
  }

  async leaveTeam(input: LeaveDealershipTeamInput): Promise<void> {
    const member =
      await this.dealership_member_repository.findOneByDealershipIdAndProfileId(
        input.dealership_id,
        input.profile_id,
      );

    if (!member) {
      throw new DealershipMemberNotFoundException(input.profile_id);
    }

    const member_primitives = member.toPrimitives();
    if (member_primitives.role !== "member") {
      throw new InvalidDealershipMembersException(
        "Solo los miembros con rol member pueden salir del equipo por esta vía",
      );
    }

    await this.dealership_member_repository.remove(member_primitives.id);
  }

  async sync(input: SyncDealershipMembersInput): Promise<void> {
    const { dealership_id, members } = input;

    this.validateOwnerCount(members);
    this.validateNoDuplicateProfileIds(members);
    await this.validateProfilesExist(members);

    const existing_members =
      await this.dealership_member_repository.findAllByDealershipId(
        dealership_id,
      );

    const incoming_by_profile_id = new Map(
      members.map((member) => [member.profile_id, member]),
    );

    for (const existing_member of existing_members) {
      const incoming = incoming_by_profile_id.get(existing_member.profile_id);

      if (!incoming) {
        await this.dealership_member_repository.remove(existing_member.id);
        continue;
      }

      if (existing_member.role !== incoming.role) {
        const updated_member = DealershipMember.fromPrimitives({
          id: existing_member.id,
          dealership_id: existing_member.dealership_id,
          profile_id: existing_member.profile_id,
          role: incoming.role,
          created_at: existing_member.created_at,
          updated_at: new Date(),
        });
        await this.dealership_member_repository.update(updated_member);
      }
    }

    const existing_profile_ids = new Set(
      existing_members.map((member) => member.profile_id),
    );

    for (const incoming_member of members) {
      if (existing_profile_ids.has(incoming_member.profile_id)) {
        continue;
      }

      const new_member = DealershipMember.create({
        dealership_id,
        profile_id: incoming_member.profile_id,
        role: incoming_member.role,
      });
      await this.dealership_member_repository.save(new_member);
    }
  }

  private validateOwnerCount(members: DealershipMemberInputDto[]): void {
    const owner_count = members.filter(
      (member) => member.role === "owner",
    ).length;

    if (owner_count !== 1) {
      throw new InvalidDealershipMembersException(
        `El concesionario debe tener exactamente un propietario; se recibieron ${owner_count}`,
      );
    }
  }

  private validateNoDuplicateProfileIds(
    members: DealershipMemberInputDto[],
  ): void {
    const profile_ids = members.map((member) => member.profile_id);
    const unique_profile_ids = new Set(profile_ids);

    if (unique_profile_ids.size !== profile_ids.length) {
      throw new InvalidDealershipMembersException(
        "No se permiten perfiles duplicados en los miembros del concesionario",
      );
    }
  }

  private async validateProfilesExist(
    members: DealershipMemberInputDto[],
  ): Promise<void> {
    const profile_ids = members.map((member) => member.profile_id);
    const profiles = await this.profile_repository.findByIds(profile_ids);
    const found_profile_ids = new Set(
      profiles.map((profile) => profile.toPrimitives().id),
    );

    for (const member of members) {
      if (!found_profile_ids.has(member.profile_id)) {
        throw new ProfileNotFoundForMemberException(member.profile_id);
      }
    }
  }
}

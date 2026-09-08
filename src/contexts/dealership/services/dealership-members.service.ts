import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberInputDto } from "../dto/dealership-member-input.dto";
import { DealershipMemberNotFoundException } from "../exceptions/dealership-member-not-found.exception";
import { InvalidDealershipMembersException } from "../exceptions/invalid-dealership-members.exception";
import { ProfileNotFoundForMemberException } from "../exceptions/profile-not-found-for-member.exception";
import { DealershipMemberDetail } from "../types/dealership-detail";
import { TypeOrmDealershipMemberRepository } from "@/src/contexts/dealership/repositories/typeorm.dealership-member-repository";
import { DealershipInvitationsService } from "./dealership-invitations.service";

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
    private readonly dealershipInvitationsService: DealershipInvitationsService,
  ) {}

  async create(input: CreateDealershipMemberInput): Promise<void> {
    await this.dealership_member_repository.save(input);
  }

  async findTeam(dealership_id: string): Promise<DealershipMemberDetail[]> {
    const members =
      await this.dealership_member_repository.findAllByDealershipId(
        dealership_id,
      );

    return members.map(member => ({
      id: member.id,
      dealership_id: member.dealership_id,
      profile_id: member.profile_id,
      role: member.role,
      created_at: member.created_at,
      updated_at: member.updated_at,
      profile: {
        id: member.profile.id,
        name: member.profile.name,
        last_name: member.profile.last_name,
        avatar_url: member.profile.avatar_url,
        email: member.profile.user.email,
      },
    }));
  }

  async updateRole(input: UpdateDealershipMemberRoleInput): Promise<void> {
    const member = await this.dealership_member_repository.findOneById(
      input.member_id,
    );
    if (!member) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    if (member.dealership_id !== input.dealership_id) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    if (member.role === "owner") {
      throw new InvalidDealershipMembersException(
        "No se puede cambiar el rol del propietario del concesionario",
      );
    }

    await this.dealership_member_repository.updateRole(member.id, input.role);
  }

  async removeMember(input: RemoveDealershipMemberInput): Promise<void> {
    const member = await this.dealership_member_repository.findOneById(
      input.member_id,
    );
    if (!member) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    if (member.dealership_id !== input.dealership_id) {
      throw new DealershipMemberNotFoundException(input.member_id);
    }

    if (member.role === "owner") {
      const team =
        await this.dealership_member_repository.findAllByDealershipId(
          input.dealership_id,
        );
      const owner_count = team.filter(
        team_member => team_member.role === "owner",
      ).length;
      if (owner_count <= 1) {
        throw new InvalidDealershipMembersException(
          "No se puede eliminar al único propietario del concesionario",
        );
      }
    }

    await this.dealershipInvitationsService.deleteInvitationsByEmail(member.profile.user.email);
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

    if (member.role !== "member") {
      throw new InvalidDealershipMembersException(
        "Solo los miembros con rol member pueden salir del equipo por esta vía",
      );
    }

    await this.dealership_member_repository.remove(member.id);
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
      members.map(member => [member.profile_id, member]),
    );

    for (const existing_member of existing_members) {
      const incoming = incoming_by_profile_id.get(existing_member.profile_id);

      if (!incoming) {
        await this.dealership_member_repository.remove(existing_member.id);
        continue;
      }

      if (existing_member.role !== incoming.role) {
        await this.dealership_member_repository.updateRole(
          existing_member.id,
          incoming.role,
        );
      }
    }

    const existing_profile_ids = new Set(
      existing_members.map(member => member.profile_id),
    );

    for (const incoming_member of members) {
      if (existing_profile_ids.has(incoming_member.profile_id)) {
        continue;
      }

      await this.dealership_member_repository.save({
        dealership_id,
        profile_id: incoming_member.profile_id,
        role: incoming_member.role,
      });
    }
  }

  private validateOwnerCount(members: DealershipMemberInputDto[]): void {
    const owner_count = members.filter(
      member => member.role === "owner",
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
    const profile_ids = members.map(member => member.profile_id);
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
    const profile_ids = members.map(member => member.profile_id);
    const profiles = await this.profile_repository.findByIds(profile_ids);
    const found_profile_ids = new Set(profiles.map(profile => profile.id));

    for (const member of members) {
      if (!found_profile_ids.has(member.profile_id)) {
        throw new ProfileNotFoundForMemberException(member.profile_id);
      }
    }
  }
}

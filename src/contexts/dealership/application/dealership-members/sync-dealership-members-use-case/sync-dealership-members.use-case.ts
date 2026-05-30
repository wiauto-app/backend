import { ProfileRepository } from "@/src/contexts/profiles/domain/repositories/profile.repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMemberInputDto } from "../../dealership/dealership-member-input.dto";
import { DealershipMember } from "../../../domain/entities/dealership-member";
import { InvalidDealershipMembersException } from "../../../domain/exceptions/invalid-dealership-members.exception";
import { ProfileNotFoundForMemberException } from "../../../domain/exceptions/profile-not-found-for-member.exception";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";

import { SyncDealershipMembersDto } from "./sync-dealership-members.dto";

@Injectable()
export class SyncDealershipMembersUseCase {
  constructor(
    private readonly dealership_member_repository: DealershipMemberRepository,
    private readonly profile_repository: ProfileRepository,
  ) {}

  async execute(sync_dealership_members_dto: SyncDealershipMembersDto): Promise<void> {
    const { dealership_id, members } = sync_dealership_members_dto;

    this.validateOwnerCount(members);
    this.validateNoDuplicateProfileIds(members);
    await this.validateProfilesExist(members);

    const existing_members =
      await this.dealership_member_repository.findAllByDealershipId(dealership_id);

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
    const owner_count = members.filter((member) => member.role === "owner").length;

    if (owner_count !== 1) {
      throw new InvalidDealershipMembersException(
        `El concesionario debe tener exactamente un propietario; se recibieron ${owner_count}`,
      );
    }
  }

  private validateNoDuplicateProfileIds(members: DealershipMemberInputDto[]): void {
    const profile_ids = members.map((member) => member.profile_id);
    const unique_profile_ids = new Set(profile_ids);

    if (unique_profile_ids.size !== profile_ids.length) {
      throw new InvalidDealershipMembersException(
        "No se permiten perfiles duplicados en los miembros del concesionario",
      );
    }
  }

  private async validateProfilesExist(members: DealershipMemberInputDto[]): Promise<void> {
    const profile_ids = members.map((member) => member.profile_id);
    const profiles = await this.profile_repository.findByIds(profile_ids);
    const found_profile_ids = new Set(profiles.map((profile) => profile.toPrimitives().id));

    for (const member of members) {
      if (!found_profile_ids.has(member.profile_id)) {
        throw new ProfileNotFoundForMemberException(member.profile_id);
      }
    }
  }
}

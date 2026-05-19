import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import {
  DealershipMember,
  PrimitiveDealershipMember,
} from "@/src/contexts/dealership/domain/entities/dealership-member";
import { DealershipInvitationRepository } from "@/src/contexts/dealership/domain/repositories/dealership-invitation.repository";
import { DealershipMemberRepository } from "@/src/contexts/dealership/domain/repositories/dealership-member.repository";

import { Profile, PrimitiveProfile } from "../../../domain/entities/profile";
import { CreateProfilePayload } from "../../../domain/payloads/create-profile.payload";
import { ProfileRepository } from "../../../domain/repositories/profile.repository";
import { ProfileUserRepository } from "../../../domain/repositories/profile-user.repository";
import { CreateProfileDto } from "./create-profile.dto";

const dealership_member_roles = new Set<PrimitiveDealershipMember["role"]>([
  "owner",
  "admin",
  "member",
]);

@Injectable()
export class CreateProfileUseCase {
  constructor(
    private readonly profile_repository: ProfileRepository,
    private readonly profile_user_repository: ProfileUserRepository,
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
    private readonly dealership_member_repository: DealershipMemberRepository,
  ) {}

  async execute(create_profile_dto: CreateProfileDto): Promise<PrimitiveProfile> {
    const email = await this.profile_user_repository.findEmailById(create_profile_dto.id);
    const accepted_invitation = email
      ? await this.dealership_invitation_repository.findAcceptedByEmail(email)
      : null;
    const dealership_member_role = accepted_invitation
      ? this.to_dealership_member_role(accepted_invitation.role)
      : null;

    const payload = this.to_create_payload(create_profile_dto);
    const profile = Profile.create(payload);
    await this.profile_repository.save(profile);

    if (accepted_invitation && dealership_member_role) {
      const member_exists =
        await this.dealership_member_repository.existsByDealershipIdAndProfileId(
          accepted_invitation.dealership_id,
          create_profile_dto.id,
        );

      if (!member_exists) {
        const dealership_member = DealershipMember.create({
          dealership_id: accepted_invitation.dealership_id,
          profile_id: create_profile_dto.id,
          role: dealership_member_role,
        });
        await this.dealership_member_repository.save(dealership_member);
      }
    }

    return profile.toPrimitives();
  }

  private to_create_payload(dto: CreateProfileDto): CreateProfilePayload {
    const payload = new CreateProfilePayload();
    payload.name = dto.name;
    payload.last_name = dto.last_name;
    payload.avatar_url = dto.avatar_url;
    payload.image_url = dto.image_url;
    payload.role_id = dto.role_id;
    return payload;
  }

  private to_dealership_member_role(role: string): PrimitiveDealershipMember["role"] {
    if (dealership_member_roles.has(role as PrimitiveDealershipMember["role"])) {
      return role as PrimitiveDealershipMember["role"];
    }

    throw new BadRequestException(`La invitación tiene un rol inválido: ${role}`);
  }
}

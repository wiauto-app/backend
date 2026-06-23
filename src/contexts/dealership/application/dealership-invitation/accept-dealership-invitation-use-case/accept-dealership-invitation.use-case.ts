import { BadRequestException } from "@nestjs/common";

import { FindByEmailUseCase } from "@/src/contexts/profiles/application/profile/find-by-email-use-case/find-by-email.use-case";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { DealershipMember, PrimitiveDealershipMember } from "../../../domain/entities/dealership-member";
import { InvitationAlreadyAcceptedException } from "../../../domain/exceptions/invitation-already-accepted.exception";
import { InvitationExpiredException } from "../../../domain/exceptions/invitation-expired.exception";
import { InvitationNotFoundException } from "../../../domain/exceptions/invitation-not-found.exception";
import { InvitationRevokedException } from "../../../domain/exceptions/invitation-revoked.exception";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { DealershipMemberRepository } from "../../../domain/repositories/dealership-member.repository";

import { AcceptDealershipInvitationDto } from "./accept-dealership-invitation.dto";

const dealership_member_roles = new Set<PrimitiveDealershipMember["role"]>([
  "owner",
  "admin",
  "member",
]);

@Injectable()
export class AcceptDealershipInvitationUseCase {
  constructor(
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
    private readonly profile_user_repository: ProfileUserRepository,
    private readonly dealership_member_repository: DealershipMemberRepository,
    private readonly find_profile_by_email_use_case: FindByEmailUseCase,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) { }

  async execute(accept_dealership_invitation_dto: AcceptDealershipInvitationDto): Promise<{
    must_create: boolean;
    email: string;
  }> {
    const token_hash = accept_dealership_invitation_dto.get_hashed_token();
    const dealership_invitation =
      await this.dealership_invitation_repository.findOneByTokenHash(token_hash);
    if (!dealership_invitation) {
      throw new InvitationNotFoundException(token_hash);
    }
    if (dealership_invitation.is_expired()) {
      throw new InvitationExpiredException();
    }
    if (dealership_invitation.is_accepted()) {
      throw new InvitationAlreadyAcceptedException();
    }
    if (dealership_invitation.is_revoked()) {
      throw new InvitationRevokedException();
    }
    const email = dealership_invitation.toPrimitives().email;
    const profile_exists = await this.profile_user_repository.existsByEmail(email);
    let added_to_team = false;

    if (profile_exists) {
      const profile = await this.find_profile_by_email_use_case.execute({ email });
      const dealership_member_exists =
        await this.dealership_member_repository.existsByDealershipIdAndProfileId(
          dealership_invitation.dealership_id,
          profile.id,
        );
      if (!dealership_member_exists) {
        const member_role = this.to_dealership_member_role(dealership_invitation.role);
        const dealership_member = DealershipMember.create({
          dealership_id: dealership_invitation.dealership_id,
          profile_id: profile.id,
          role: member_role,
        });
        await this.dealership_member_repository.save(dealership_member);
        added_to_team = true;
      }
    }

    const accepted_invitation = dealership_invitation.update({
      status: "accepted",
      accepted_at: new Date(),
    });
    await this.dealership_invitation_repository.update(accepted_invitation);

    if (added_to_team) {
      await this.outbound_mail_enqueue_service.enqueue_dealership_team_joined({
        to: email,
        role: dealership_invitation.role,
        dealership_id: dealership_invitation.dealership_id,
      });
    }

    return {
      must_create: !profile_exists,
      email,
    };
  }

  private to_dealership_member_role(
    role: string,
  ): PrimitiveDealershipMember["role"] {
    if (dealership_member_roles.has(role as PrimitiveDealershipMember["role"])) {
      return role as PrimitiveDealershipMember["role"];
    }

    throw new BadRequestException(`La invitación tiene un rol inválido: ${role}`);
  }
}

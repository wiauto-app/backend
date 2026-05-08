import { InvitationAlreadyAcceptedException } from "../../../domain/exceptions/invitation-already-accepted.exception";
import { InvitationExpiredException } from "../../../domain/exceptions/invitation-expired.exception";
import { InvitationNotFoundException } from "../../../domain/exceptions/invitation-not-found.exception";
import { InvitationRevokedException } from "../../../domain/exceptions/invitation-revoked.exception";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { AcceptDealershipInvitationDto } from "./accept-dealership-invitation.dto";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";


@Injectable()
export class AcceptDealershipInvitationUseCase {
  constructor(
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
    private readonly profile_user_repository: ProfileUserRepository
  ) {}

  async execute(accept_dealership_invitation_dto: AcceptDealershipInvitationDto): Promise<{
    must_create:boolean,
    email:string
  }> {
    const token_hash = accept_dealership_invitation_dto.get_hashed_token();
    const dealership_invitation = await this.dealership_invitation_repository.findOneByTokenHash(token_hash);
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
    const accepted_invitation = dealership_invitation.update({
      status: "accepted",
      accepted_at: new Date(),
    });
    await this.dealership_invitation_repository.update(accepted_invitation);
    return {
      must_create: !profile_exists,
      email: email,
    };
  }
}
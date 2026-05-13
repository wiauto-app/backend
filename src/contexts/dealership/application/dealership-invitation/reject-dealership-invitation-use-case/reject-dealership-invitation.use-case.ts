import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { InvitationAlreadyAcceptedException } from "../../../domain/exceptions/invitation-already-accepted.exception";
import { InvitationExpiredException } from "../../../domain/exceptions/invitation-expired.exception";
import { InvitationNotFoundException } from "../../../domain/exceptions/invitation-not-found.exception";
import { InvitationRevokedException } from "../../../domain/exceptions/invitation-revoked.exception";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";

import { RejectDealershipInvitationDto } from "./reject-dealership-invitation.dto";

@Injectable()
export class RejectDealershipInvitationUseCase {
  constructor(
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
  ) {}

  async execute(
    reject_dealership_invitation_dto: RejectDealershipInvitationDto,
  ): Promise<{ email: string }> {
    const token_hash = reject_dealership_invitation_dto.get_hashed_token();
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
    const revoked_invitation = dealership_invitation.update({
      status: "revoked",
    });
    await this.dealership_invitation_repository.update(revoked_invitation);

    return { email };
  }
}

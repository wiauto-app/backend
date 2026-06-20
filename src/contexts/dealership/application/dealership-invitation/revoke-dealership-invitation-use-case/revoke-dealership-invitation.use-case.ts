import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";

import { InvitationNotFoundException } from "../../../domain/exceptions/invitation-not-found.exception";
import { InvitationNotPendingException } from "../../../domain/exceptions/invitation-not-pending.exception";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { RevokeDealershipInvitationDto } from "./revoke-dealership-invitation.dto";

@Injectable()
export class RevokeDealershipInvitationUseCase {
  constructor(
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
  ) {}

  async execute(dto: RevokeDealershipInvitationDto): Promise<void> {
    const invitation = await this.dealership_invitation_repository.findOne(dto.id);
    if (!invitation) {
      throw new InvitationNotFoundException(dto.id);
    }

    const primitives = invitation.toPrimitives();
    if (primitives.status !== "pending") {
      throw new InvitationNotPendingException(dto.id);
    }

    const revoked = invitation.update({ status: "revoked" });
    await this.dealership_invitation_repository.update(revoked);
  }
}

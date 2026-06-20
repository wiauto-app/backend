import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { CreateDealershipInvitationDto } from "./create-dealership-invitation.dto";
import { DealershipInvitation } from "../../../domain/entities/dealership-invitations";
import { hashToken } from "@/src/contexts/shared/token_management/hash_token";
import { generateToken } from "@/src/contexts/shared/token_management/generate_token";
import { DealershipInvitationEmailService } from "../../../domain/services/dealership-invitation-email.service";
import { InvitationAlreadyAcceptedException } from "../../../domain/exceptions/invitation-already-accepted.exception";

@Injectable()
export class CreateDealershipInvitationUseCase {
  constructor(
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
    private readonly dealership_invitation_email_service: DealershipInvitationEmailService,
  ) { }

  async execute(create_dealership_invitation_dto: CreateDealershipInvitationDto): Promise<void> {
    const accepted_invitation = await this.dealership_invitation_repository.findAcceptedByEmail(
      create_dealership_invitation_dto.email,
    );
    if (accepted_invitation) {
      throw new InvitationAlreadyAcceptedException();
    }

    const pending_invitation =
      await this.dealership_invitation_repository.findPendingByEmailAndDealershipId(
        create_dealership_invitation_dto.email,
        create_dealership_invitation_dto.dealership_id,
      );

    if (pending_invitation) {
      const revoked = pending_invitation.update({ status: "revoked" });
      await this.dealership_invitation_repository.update(revoked);
    }

    const token = generateToken();
    const token_hash = hashToken(token);
    const dealership_invitation = DealershipInvitation.create({
      email: create_dealership_invitation_dto.email,
      role: create_dealership_invitation_dto.role,
      dealership_id: create_dealership_invitation_dto.dealership_id,
      invited_by_id: create_dealership_invitation_dto.invited_by_id,
      token_hash: token_hash,
      status: "pending",
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
      accepted_at: null,
    });
    await this.dealership_invitation_repository.save(dealership_invitation);

    await this.dealership_invitation_email_service.send_invitation_email({
      invited_email: create_dealership_invitation_dto.email,
      invited_role: create_dealership_invitation_dto.role,
      dealership_id: create_dealership_invitation_dto.dealership_id,
      invitation_token: token,
    });
  }
}

import { PrimitiveDealershipInvitation } from "../../../domain/entities/dealership-invitations";
import { InvitationNotFoundException } from "../../../domain/exceptions/invitation-not-found.exception";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { FindOneByEmailDto } from "./find-one-by-email.dto";


export class FindOneByEmailUseCase {
  constructor(private readonly dealership_invitation_repository: DealershipInvitationRepository) {}

  async execute(find_one_by_email_dto: FindOneByEmailDto): Promise<{
    dealership_invitation: PrimitiveDealershipInvitation
  }> {
    const dealership_invitation = await this.dealership_invitation_repository.findOneByEmail(find_one_by_email_dto.email);
    if (!dealership_invitation) {
      throw new InvitationNotFoundException(find_one_by_email_dto.email);
    }
    return { dealership_invitation: dealership_invitation.toPrimitives() };
  }
}
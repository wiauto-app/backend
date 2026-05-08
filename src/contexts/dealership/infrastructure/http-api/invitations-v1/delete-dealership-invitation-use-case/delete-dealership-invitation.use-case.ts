import { DealershipInvitationRepository } from "@/src/contexts/dealership/domain/repositories/dealership-invitation.repository";
import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DeleteDealershipInvitationDto } from "./delete-dealership-invitation.dto";

@Injectable()
export class DeleteDealershipInvitationUseCase {
  constructor(private readonly dealership_invitation_repository: DealershipInvitationRepository) {}

  async execute(delete_dealership_invitation_dto: DeleteDealershipInvitationDto): Promise<void> {
    await this.dealership_invitation_repository.delete(delete_dealership_invitation_dto.id);
  }
}
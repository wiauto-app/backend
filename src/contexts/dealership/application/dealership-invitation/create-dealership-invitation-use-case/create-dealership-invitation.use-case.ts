import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { CreateDealershipInvitationDto } from "./create-dealership-invitation.dto";
import { DealershipInvitation } from "../../../domain/entities/dealership-invitations";
import { hashToken } from "@/src/contexts/shared/token_management/hash_token";
import { generateToken } from "@/src/contexts/shared/token_management/generate_token";

@Injectable()
export class CreateDealershipInvitationUseCase {
  constructor(private readonly dealership_invitation_repository: DealershipInvitationRepository) {}

  async execute(create_dealership_invitation_dto: CreateDealershipInvitationDto): Promise<void> {
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
  }
}
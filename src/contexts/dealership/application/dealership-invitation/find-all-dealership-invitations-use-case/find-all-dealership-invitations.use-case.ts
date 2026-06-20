import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";

import { DealershipInvitation } from "../../../domain/entities/dealership-invitations";
import { DealershipInvitationsFilter } from "../../../domain/filters/dealership-invitation.filter";
import { DealershipInvitationRepository } from "../../../domain/repositories/dealership-invitation.repository";
import { FindAllDealershipInvitationsDto } from "./find-all-dealership-invitations.dto";

@Injectable()
export class FindAllDealershipInvitationsUseCase {
  constructor(
    private readonly dealership_invitation_repository: DealershipInvitationRepository,
  ) {}

  async execute(
    dto: FindAllDealershipInvitationsDto,
  ): Promise<PaginatedResult<DealershipInvitation>> {
    const filter = new DealershipInvitationsFilter({
      dealership_id: dto.dealership_id,
      status: dto.status,
      page: dto.page ?? 1,
      limit: dto.limit ?? 20,
      order_by: "created_at",
      order_direction: "DESC",
    });

    return this.dealership_invitation_repository.findAll(filter);
  }
}

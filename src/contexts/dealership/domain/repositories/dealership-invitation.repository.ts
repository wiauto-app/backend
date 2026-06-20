import { PaginatedResult } from "@/src/contexts/shared/domain/value-objects/paginated-result.vo";
import { DealershipInvitation } from "../entities/dealership-invitations";
import { DealershipInvitationsFilter } from "../filters/dealership-invitation.filter";

export abstract class DealershipInvitationRepository {
  abstract save(dealership_invitation: DealershipInvitation): Promise<void>;
  abstract findOne(id: string): Promise<DealershipInvitation | null>;
  abstract findOneByTokenHash(token_hash: string): Promise<DealershipInvitation | null>;
  abstract findOneByEmail(email: string): Promise<DealershipInvitation | null>;
  abstract findAcceptedByEmail(email: string): Promise<DealershipInvitation | null>;
  abstract findPendingByEmailAndDealershipId(
    email: string,
    dealership_id: string,
  ): Promise<DealershipInvitation | null>;
  abstract findAll(filter: DealershipInvitationsFilter): Promise<PaginatedResult<DealershipInvitation>>;
  abstract update(dealership_invitation: DealershipInvitation): Promise<void>;
  abstract delete(id: string): Promise<void>;
}

import { DealershipInvitationsEntity } from "../entities/dealership-invitations.entity";

export interface DealershipInvitationJoinStatusResponse {
  invitation_id: string;
  belongs_to_current_user: boolean;
  invited_email: string;
  current_user_email: string;
  dealership_id: string;
  dealership_name: string;
  status: DealershipInvitationsEntity["status"];
}

export interface SendDealershipInvitationEmailPayload {
  invited_email: string;
  invited_role: string;
  invitation_token: string;
  dealership_id: string;
}

export abstract class DealershipInvitationEmailService {
  abstract send_invitation_email(
    payload: SendDealershipInvitationEmailPayload,
  ): Promise<void>;
}

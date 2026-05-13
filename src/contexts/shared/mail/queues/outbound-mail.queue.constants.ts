export const OUTBOUND_MAIL_QUEUE = "outbound-mail";

export const OUTBOUND_MAIL_JOB_DEALERSHIP_INVITATION = "dealership_invitation";

export interface OutboundMailDealershipInvitationJobData {
  invited_email: string;
  invited_role: string;
  dealership_id: string;
  invitation_token: string;
}

export const OUTBOUND_MAIL_JOB_PASSWORD_RECOVERY = "password_recovery";

export interface OutboundMailPasswordRecoveryJobData {
  to: string;
  recovery_link: string;
}

export const OUTBOUND_MAIL_JOB_DEALERSHIP_TEAM_JOINED = "dealership_team_joined";

export interface OutboundMailDealershipTeamJoinedJobData {
  to: string;
  role: string;
  dealership_id: string;
}

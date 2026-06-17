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

export const OUTBOUND_MAIL_JOB_LEAD_NOTIFICATION = "lead_notification";

export interface OutboundMailLeadNotificationJobData {
  to: string;
  vehicle_title: string;
  lead: {
    name: string;
    email: string;
    phone: string | null;
    phone_code: string | null;
    message: string;
  };
}

export const OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED = "vehicle_status_changed";

export interface OutboundMailVehicleStatusChangedJobData {
  to: string;
  vehicle_title: string;
  previous_status_label: string;
  new_status_label: string;
  status_change_message: string | null;
}

export const OUTBOUND_MAIL_JOB_ALERT_MATCH_NOTIFICATION = "alert_match_notification";
export const OUTBOUND_MAIL_JOB_ALERT_EVENT_NOTIFICATION = "alert_event_notification";
export const OUTBOUND_MAIL_JOB_ALERT_DIGEST_NOTIFICATION = "alert_digest_notification";

export interface OutboundMailAlertMatchNotificationJobData {
  to: string;
  alert_name: string;
  vehicle_title: string;
  vehicle_price: number;
  vehicle_detail_url: string;
  vehicle_image_url: string | null;
  vehicle_year: number;
  vehicle_mileage: number;
  vehicle_fuel_label: string;
  vehicle_transmission_label: string;
  vehicle_location_label: string;
}

export interface OutboundMailAlertEventNotificationJobData {
  to: string;
  event_type: string;
  title: string;
  body_summary: string;
  vehicle_detail_url: string;
  vehicle_image_url: string | null;
  alert_name: string | null;
}

export interface OutboundMailAlertDigestNotificationJobData {
  to: string;
  frequency: "daily" | "weekly";
  events_count: number;
  events: Array<{
    event_type: string;
    title: string;
    summary: string;
  }>;
}

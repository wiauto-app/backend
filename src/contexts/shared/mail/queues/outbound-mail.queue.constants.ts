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
  contacts_url?: string;
  vehicle?: {
    id: string;
    title: string;
    price: number | null;
    image_url: string | null;
    year: number | null;
    mileage: number | null;
    fuel_label: string;
    transmission_label: string;
    location_label: string;
    detail_url: string;
    edit_url: string;
  } | null;
  lead: {
    type: string;
    name: string;
    email: string | null;
    phone: string | null;
    phone_code: string | null;
    message: string | null;
    callback_scheduled_at: string | null;
  };
}

export const OUTBOUND_MAIL_JOB_PLAN_LEAD_REQUEST_NOTIFICATION =
  "plan_lead_request_notification";

export interface OutboundMailPlanLeadRequestNotificationJobData {
  to: string;
  lead: {
    name: string;
    email: string;
    phone: string;
    cars_quantity: string;
    message: string | null;
  };
  created_at: string;
}

export const OUTBOUND_MAIL_JOB_SUBSCRIPTION_WELCOME = "subscription_welcome";

export interface OutboundMailSubscriptionWelcomeJobData {
  to: string;
  plan_name: string;
  is_new_guest_user: boolean;
  temporary_password?: string;
}

export const OUTBOUND_MAIL_JOB_SUBSCRIPTION_CANCEL_SCHEDULED =
  "subscription_cancel_scheduled";

export interface OutboundMailSubscriptionCancelScheduledJobData {
  to: string;
  plan_name: string;
  period_end: string;
  portal_url: string;
}

export const OUTBOUND_MAIL_JOB_SUBSCRIPTION_ENDED = "subscription_ended";

export interface OutboundMailSubscriptionEndedJobData {
  to: string;
  plan_name: string;
}

export const OUTBOUND_MAIL_JOB_CHECKOUT_ABANDONED = "checkout_abandoned";

export interface OutboundMailCheckoutAbandonedJobData {
  to: string;
  plan_name: string | null;
  plans_url: string;
}

export const OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_FAILED =
  "subscription_payment_failed";

export interface OutboundMailSubscriptionPaymentFailedJobData {
  to: string;
  plan_name: string | null;
  portal_url: string | null;
}

export const OUTBOUND_MAIL_JOB_VEHICLE_STATUS_CHANGED = "vehicle_status_changed";

/** @deprecated Preferir jobs temáticos (published/approved/rejected/…). */
export interface OutboundMailVehicleStatusChangedJobData {
  to: string;
  vehicle_title: string;
  previous_status_label: string;
  new_status_label: string;
  status_change_message: string | null;
}

export const OUTBOUND_MAIL_JOB_VEHICLE_PUBLISHED = "vehicle_published";
export const OUTBOUND_MAIL_JOB_VEHICLE_APPROVED = "vehicle_approved";
export const OUTBOUND_MAIL_JOB_VEHICLE_REJECTED = "vehicle_rejected";
export const OUTBOUND_MAIL_JOB_VEHICLE_DEACTIVATED = "vehicle_deactivated";
export const OUTBOUND_MAIL_JOB_VEHICLE_SOLD = "vehicle_sold";
export const OUTBOUND_MAIL_JOB_VEHICLE_ARCHIVED = "vehicle_archived";
export const OUTBOUND_MAIL_JOB_VEHICLE_EXPIRY_WARNING =
  "vehicle_expiry_warning";
export const OUTBOUND_MAIL_JOB_VEHICLE_EXPIRED = "vehicle_expired";
export const OUTBOUND_MAIL_JOB_NEW_MESSAGE_NOTIFICATION =
  "new_message_notification";

export interface OutboundMailVehicleCardJobFields {
  id: string;
  title: string;
  price: number | null;
  image_url: string | null;
  year: number | null;
  mileage: number | null;
  fuel_label: string;
  transmission_label: string;
  location_label: string;
  detail_url: string;
  edit_url: string;
}

export interface OutboundMailSellerVehicleJobData {
  to: string;
  vehicle: OutboundMailVehicleCardJobFields;
  status_change_message?: string | null;
  expires_at_label?: string | null;
}

export interface OutboundMailNewMessageNotificationJobData {
  to: string;
  sender_name: string;
  message_excerpt: string;
  messages_url: string;
  vehicle: OutboundMailVehicleCardJobFields | null;
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

export const OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_NOTIFICATION =
  "appraisal_request_notification";

export interface OutboundMailAppraisalRequestNotificationJobData {
  to: string;
  appraisal: {
    vehicle_label: string;
    mileage: number;
    name: string;
    email: string;
    phone_code: string;
    phone: string;
    address: string | null;
  };
  created_at: string;
}

export const OUTBOUND_MAIL_JOB_APPRAISAL_REQUEST_ANSWERED =
  "appraisal_request_answered";

export interface OutboundMailAppraisalRequestAnsweredJobData {
  to: string;
  name: string;
  vehicle_label: string;
  estimated_price_min: number;
  estimated_price_max: number;
  admin_note: string | null;
}

/** Pago recibido / renovación + enlace de factura (un solo correo). */
export const OUTBOUND_MAIL_JOB_SUBSCRIPTION_PAYMENT_RECEIVED =
  "subscription_payment_received";

export interface OutboundMailSubscriptionPaymentReceivedJobData {
  to: string;
  plan_name: string;
  amount_label: string;
  currency: string;
  is_renewal: boolean;
  invoice_url: string | null;
  portal_url: string | null;
}

export const OUTBOUND_MAIL_JOB_SUBSCRIPTION_PLAN_CHANGED =
  "subscription_plan_changed";

export interface OutboundMailSubscriptionPlanChangedJobData {
  to: string;
  previous_plan_name: string;
  new_plan_name: string;
  portal_url: string | null;
}

export const OUTBOUND_MAIL_JOB_LISTING_LIMIT_REACHED = "listing_limit_reached";

export interface OutboundMailListingLimitReachedJobData {
  to: string;
  max_listings: number;
  listings_used: number;
  plan_name: string | null;
  plans_url: string;
}

export const OUTBOUND_MAIL_JOB_FEATURED_PURCHASED = "featured_purchased";

export interface OutboundMailFeaturedPurchasedJobData {
  to: string;
  vehicle_title: string;
  featured_expires_at_label: string;
  vehicle_edit_url: string;
}

export const OUTBOUND_MAIL_JOB_FEATURED_EXPIRED = "featured_expired";

export interface OutboundMailFeaturedExpiredJobData {
  to: string;
  vehicle_title: string;
  vehicle_edit_url: string;
}

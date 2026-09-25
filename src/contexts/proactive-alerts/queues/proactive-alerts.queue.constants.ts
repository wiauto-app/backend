export const PROACTIVE_ALERTS_QUEUE = "proactive-alerts";

export const PROACTIVE_ALERTS_JOB_DAILY = "daily_batch";
export const PROACTIVE_ALERTS_JOB_WEEKLY = "weekly_summary";
export const PROACTIVE_ALERTS_JOB_HOT_LEAD = "hot_lead_check";
export const PROACTIVE_ALERTS_JOB_VEHICLE_PUBLISHED = "vehicle_published";

export interface ProactiveAlertsDailyJobData {
  profile_id?: string;
}

export interface ProactiveAlertsHotLeadJobData {
  lead_id: string;
  seller_profile_id: string;
}

export interface ProactiveAlertsVehiclePublishedJobData {
  seller_profile_id: string;
  vehicle_id: string;
  price: number;
  model_key: string;
}

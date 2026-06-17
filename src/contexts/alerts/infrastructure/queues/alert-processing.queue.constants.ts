export const ALERT_PROCESSING_QUEUE = "alert-processing";

export const ALERT_PROCESSING_JOB_VEHICLE_PUBLISHED = "vehicle_published";
export const ALERT_PROCESSING_JOB_VEHICLE_EVENT = "vehicle_event";

export interface AlertProcessingVehiclePublishedJobData {
  vehicle_id: string;
}

export interface AlertProcessingVehicleEventJobData {
  vehicle_id?: string;
  event_type: string;
  profile_id?: string;
  metadata?: Record<string, unknown>;
}

export const ALERT_DIGEST_QUEUE = "alert-digest";

export const ALERT_DIGEST_JOB_DAILY = "daily_digest";
export const ALERT_DIGEST_JOB_WEEKLY = "weekly_digest";
export const ALERT_DIGEST_JOB_REMINDERS = "saved_vehicle_reminders";

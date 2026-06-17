import type { AlertNotificationFrequency } from "../../domain/enums/alert-notification-frequency.enum";

const DIGEST_HOUR_UTC = 8;

export const compute_digest_scheduled_for = (
  frequency: AlertNotificationFrequency,
  from: Date = new Date(),
): Date | null => {
  if (frequency === "instant") {
    return null;
  }

  const scheduled = new Date(from);
  scheduled.setUTCHours(DIGEST_HOUR_UTC, 0, 0, 0);

  if (frequency === "daily") {
    if (scheduled.getTime() <= from.getTime()) {
      scheduled.setUTCDate(scheduled.getUTCDate() + 1);
    }
    return scheduled;
  }

  const day = scheduled.getUTCDay();
  const days_until_monday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  if (days_until_monday === 0 && scheduled.getTime() <= from.getTime()) {
    scheduled.setUTCDate(scheduled.getUTCDate() + 7);
  } else {
    scheduled.setUTCDate(scheduled.getUTCDate() + days_until_monday);
  }

  return scheduled;
};

import type { AlertNotificationFrequency } from "../../domain/enums/alert-notification-frequency.enum";

export const calculate_digest_scheduled_for = (
  frequency: AlertNotificationFrequency,
  reference_date: Date = new Date(),
): Date | null => {
  if (frequency === "instant") {
    return null;
  }

  const scheduled = new Date(reference_date);
  scheduled.setHours(8, 0, 0, 0);

  if (frequency === "daily") {
    if (scheduled <= reference_date) {
      scheduled.setDate(scheduled.getDate() + 1);
    }
    return scheduled;
  }

  const day = scheduled.getDay();
  const days_until_monday = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
  scheduled.setDate(scheduled.getDate() + days_until_monday);
  if (scheduled <= reference_date) {
    scheduled.setDate(scheduled.getDate() + 7);
  }
  return scheduled;
};

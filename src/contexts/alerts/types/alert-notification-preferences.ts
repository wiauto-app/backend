import type { AlertNotificationFrequency } from "./alert-notification-frequency.enum";

export interface PrimitiveAlertNotificationPreferences {
  profile_id: string;
  notify_new_matches: boolean;
  notify_price_drops: boolean;
  notify_favorite_changes: boolean;
  notify_new_messages: boolean;
  notify_seller_replies: boolean;
  notify_saved_vehicle_reminders: boolean;
  saved_vehicle_reminder_days: number;
  frequency: AlertNotificationFrequency;
  channel_email: boolean;
  channel_push: boolean;
  channel_sms: boolean;
  created_at: Date;
  updated_at: Date;
}

export class AlertNotificationPreferences {
  constructor(
    private readonly primitive_preferences: PrimitiveAlertNotificationPreferences,
  ) {}

  static createDefaults(profile_id: string): AlertNotificationPreferences {
    return new AlertNotificationPreferences({
      profile_id,
      notify_new_matches: true,
      notify_price_drops: true,
      notify_favorite_changes: true,
      notify_new_messages: true,
      notify_seller_replies: true,
      notify_saved_vehicle_reminders: true,
      saved_vehicle_reminder_days: 7,
      frequency: "instant",
      channel_email: true,
      channel_push: true,
      channel_sms: false,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  update(
    payload: Partial<
      Omit<
        PrimitiveAlertNotificationPreferences,
        "profile_id" | "created_at" | "updated_at"
      >
    >,
  ): AlertNotificationPreferences {
    return new AlertNotificationPreferences({
      ...this.primitive_preferences,
      ...payload,
      updated_at: new Date(),
    });
  }

  static fromPrimitives(
    primitive: PrimitiveAlertNotificationPreferences,
  ): AlertNotificationPreferences {
    return new AlertNotificationPreferences(primitive);
  }

  toPrimitives(): PrimitiveAlertNotificationPreferences {
    return { ...this.primitive_preferences };
  }
}

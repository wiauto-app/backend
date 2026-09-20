import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";

import { TypeOrmAlertNotificationPreferencesRepository } from "../repositories/typeorm.alert-notification-preferences.repository";
import { AlertNotificationPreferences } from "../types/alert-notification-preferences";
import type { NotifyInput } from "../types/notify-input";
import {
  get_enabled_channels,
  is_category_toggle_enabled,
} from "./alert-notification-rules";
import { NotificationEmailChannelService } from "./notification-email-channel.service";
import { NotificationInAppChannelService } from "./notification-in-app-channel.service";
import { NotificationPushChannelService } from "./notification-push-channel.service";
import { NotificationSmsChannelStubService } from "./notification-sms-channel-stub.service";
import { NotificationWhatsappChannelService } from "./notification-whatsapp-channel.service";

@Injectable()
export class NotificationChannelDispatcher {
  constructor(
    private readonly preferences_repository: TypeOrmAlertNotificationPreferencesRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly email_channel: NotificationEmailChannelService,
    private readonly in_app_channel: NotificationInAppChannelService,
    private readonly push_channel: NotificationPushChannelService,
    private readonly sms_channel: NotificationSmsChannelStubService,
    private readonly whatsapp_channel: NotificationWhatsappChannelService,
  ) {}

  async notify(input: NotifyInput): Promise<void> {
    if (!input.profile_id) {
      const email = input.email_override?.trim();
      if (!email) {
        return;
      }

      await this.email_channel.send({
        to: email,
        profile_id: null,
        category: input.category,
        title: input.title,
        body: input.body,
        data: input.data,
      });
      return;
    }

    const selected_channels = input.channels_override
      ? [...input.channels_override]
      : await this.get_account_channels(input.profile_id, input.category);
    const excluded_channels = new Set(input.exclude_channels ?? []);
    const channels = selected_channels.filter(
      (channel) => !excluded_channels.has(channel),
    );
    if (channels.length === 0) {
      return;
    }

    const email =
      input.email_override ??
      (await this.profile_user_repository.findEmailById(input.profile_id));

    const errors: unknown[] = [];

    // El in-app va primero: su id viaja en el `data` del push para que la app pueda
    // marcar la notificación como leída.
    let notification_id: string | null = null;
    if (channels.includes("in_app")) {
      try {
        notification_id = await this.in_app_channel.send(input);
      } catch (error) {
        errors.push(error);
      }
    }

    const sends: Promise<void>[] = [];

    for (const channel of channels) {
      if (channel === "email") {
        if (!email) {
          continue;
        }
        sends.push(
          this.email_channel.send({
            to: email,
            profile_id: input.profile_id,
            category: input.category,
            title: input.title,
            body: input.body,
            data: input.data,
          }),
        );
        continue;
      }

      // El canal push nunca lanza: un fallo de FCM/Expo no debe afectar a los demás canales.
      if (channel === "push") {
        sends.push(this.push_channel.send(input, { notification_id }));
        continue;
      }

      if (channel === "sms") {
        sends.push(this.sms_channel.send(input));
        continue;
      }

      if (channel === "whatsapp") {
        sends.push(this.whatsapp_channel.send(input));
      }
    }

    const settled = await Promise.allSettled(sends);
    for (const result of settled) {
      if (result.status === "rejected") {
        errors.push(result.reason);
      }
    }

    if (errors.length > 0) {
      throw errors[0];
    }
  }

  private async load_preferences(
    profile_id: string,
  ): Promise<AlertNotificationPreferences> {
    const existing =
      await this.preferences_repository.findByProfileId(profile_id);
    if (existing) {
      return existing;
    }

    const defaults = AlertNotificationPreferences.createDefaults(profile_id);
    await this.preferences_repository.save(defaults);
    return defaults;
  }

  private async get_account_channels(
    profile_id: string,
    category: string,
  ) {
    const preferences = await this.load_preferences(profile_id);
    const primitive = preferences.toPrimitives();

    if (!is_category_toggle_enabled(category, primitive)) {
      return [];
    }

    return get_enabled_channels(primitive);
  }
}

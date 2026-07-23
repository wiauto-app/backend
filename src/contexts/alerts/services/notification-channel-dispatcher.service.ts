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
import { NotificationPushChannelStubService } from "./notification-push-channel-stub.service";
import { NotificationSmsChannelStubService } from "./notification-sms-channel-stub.service";
import { NotificationWhatsappChannelService } from "./notification-whatsapp-channel.service";

@Injectable()
export class NotificationChannelDispatcher {
  constructor(
    private readonly preferences_repository: TypeOrmAlertNotificationPreferencesRepository,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly email_channel: NotificationEmailChannelService,
    private readonly in_app_channel: NotificationInAppChannelService,
    private readonly push_channel: NotificationPushChannelStubService,
    private readonly sms_channel: NotificationSmsChannelStubService,
    private readonly whatsapp_channel: NotificationWhatsappChannelService,
  ) {}

  async notify(input: NotifyInput): Promise<void> {
    const preferences = await this.load_preferences(input.profile_id);
    const preferences_primitive = preferences.toPrimitives();

    if (!is_category_toggle_enabled(input.category, preferences_primitive)) {
      return;
    }

    const channels = get_enabled_channels(preferences_primitive);
    if (channels.length === 0) {
      return;
    }

    const email =
      input.email_override ??
      (await this.profile_user_repository.findEmailById(input.profile_id));

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

      if (channel === "in_app") {
        sends.push(this.in_app_channel.send(input));
        continue;
      }

      if (channel === "push") {
        sends.push(this.push_channel.send(input));
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

    await Promise.all(sends);
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
}

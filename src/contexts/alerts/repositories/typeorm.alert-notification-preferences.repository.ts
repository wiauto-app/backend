import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { AlertNotificationPreferences } from "../types/alert-notification-preferences";
import { AlertNotificationPreferencesEntity } from "../entities/alert-notification-preferences.entity";

const entity_to_preferences = (
  entity: AlertNotificationPreferencesEntity,
): AlertNotificationPreferences =>
  AlertNotificationPreferences.fromPrimitives({
    profile_id: entity.profile_id,
    notify_new_matches: entity.notify_new_matches,
    notify_price_drops: entity.notify_price_drops,
    notify_favorite_changes: entity.notify_favorite_changes,
    notify_new_messages: entity.notify_new_messages,
    notify_seller_replies: entity.notify_seller_replies,
    notify_saved_vehicle_reminders: entity.notify_saved_vehicle_reminders,
    notify_new_leads: entity.notify_new_leads,
    saved_vehicle_reminder_days: entity.saved_vehicle_reminder_days,
    frequency: entity.frequency,
    channel_email: entity.channel_email,
    channel_push: entity.channel_push,
    channel_sms: entity.channel_sms,
    channel_in_app: entity.channel_in_app,
    channel_whatsapp: entity.channel_whatsapp,
    created_at: entity.created_at,
    updated_at: entity.updated_at,
  });

@Injectable()
export class TypeOrmAlertNotificationPreferencesRepository {
  constructor(
    @InjectRepository(AlertNotificationPreferencesEntity)
    private readonly preferences_repository: Repository<AlertNotificationPreferencesEntity>,
  ) {}

  async findByProfileId(
    profile_id: string,
  ): Promise<AlertNotificationPreferences | null> {
    const row = await this.preferences_repository.findOne({
      where: { profile_id },
    });
    if (!row) {
      return null;
    }
    return entity_to_preferences(row);
  }

  async save(preferences: AlertNotificationPreferences): Promise<void> {
    const primitive = preferences.toPrimitives();
    await this.preferences_repository.save(
      this.preferences_repository.create({
        profile_id: primitive.profile_id,
        notify_new_matches: primitive.notify_new_matches,
        notify_price_drops: primitive.notify_price_drops,
        notify_favorite_changes: primitive.notify_favorite_changes,
        notify_new_messages: primitive.notify_new_messages,
        notify_seller_replies: primitive.notify_seller_replies,
        notify_saved_vehicle_reminders: primitive.notify_saved_vehicle_reminders,
        notify_new_leads: primitive.notify_new_leads,
        saved_vehicle_reminder_days: primitive.saved_vehicle_reminder_days,
        frequency: primitive.frequency,
        channel_email: primitive.channel_email,
        channel_push: primitive.channel_push,
        channel_sms: primitive.channel_sms,
        channel_in_app: primitive.channel_in_app,
        channel_whatsapp: primitive.channel_whatsapp,
        created_at: primitive.created_at,
        updated_at: primitive.updated_at,
      }),
    );
  }

  async update(preferences: AlertNotificationPreferences): Promise<void> {
    const primitive = preferences.toPrimitives();
    const preloaded = await this.preferences_repository.preload({
      profile_id: primitive.profile_id,
      notify_new_matches: primitive.notify_new_matches,
      notify_price_drops: primitive.notify_price_drops,
      notify_favorite_changes: primitive.notify_favorite_changes,
      notify_new_messages: primitive.notify_new_messages,
      notify_seller_replies: primitive.notify_seller_replies,
      notify_saved_vehicle_reminders: primitive.notify_saved_vehicle_reminders,
      notify_new_leads: primitive.notify_new_leads,
      saved_vehicle_reminder_days: primitive.saved_vehicle_reminder_days,
      frequency: primitive.frequency,
      channel_email: primitive.channel_email,
      channel_push: primitive.channel_push,
      channel_sms: primitive.channel_sms,
      channel_in_app: primitive.channel_in_app,
      channel_whatsapp: primitive.channel_whatsapp,
      updated_at: primitive.updated_at,
    });

    if (!preloaded) {
      await this.save(preferences);
      return;
    }

    await this.preferences_repository.save(preloaded);
  }
}

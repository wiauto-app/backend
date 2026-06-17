import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";

import { AlertNotificationEventRepository } from "../../domain/repositories/alert-notification-event.repository";
import { AlertNotificationDispatcher } from "../../domain/ports/alert-notification.port";

export class SendAlertDigestDto {
  frequency: "daily" | "weekly";
}

@Injectable()
export class SendAlertDigestUseCase {
  constructor(
    private readonly event_repository: AlertNotificationEventRepository,
    private readonly profile_user_repository: ProfileUserRepository,
    private readonly alert_notification_dispatcher: AlertNotificationDispatcher,
  ) {}

  async execute(dto: SendAlertDigestDto): Promise<void> {
    const pending_events = await this.event_repository.findPendingForDigest({
      frequency: dto.frequency,
      before: new Date(),
    });

    if (pending_events.length === 0) {
      return;
    }

    const grouped = new Map<string, typeof pending_events>();
    for (const event of pending_events) {
      const profile_id = event.toPrimitives().profile_id;
      const current = grouped.get(profile_id) ?? [];
      current.push(event);
      grouped.set(profile_id, current);
    }

    for (const [profile_id, events] of grouped.entries()) {
      const email = await this.profile_user_repository.findEmailById(profile_id);
      if (!email) {
        continue;
      }

      await this.alert_notification_dispatcher.notifyDigest({
        to: email,
        frequency: dto.frequency,
        events: events.map((event) => {
          const primitive = event.toPrimitives();
          return {
            event_type: primitive.event_type,
            payload: primitive.payload,
          };
        }),
      });

      for (const event of events) {
        await this.event_repository.update(event.markSent());
      }
    }
  }
}

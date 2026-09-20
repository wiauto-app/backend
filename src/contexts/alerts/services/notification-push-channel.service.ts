import { Inject, Injectable, Logger } from "@nestjs/common";

import {
  ProfileDevices,
  PushTokenType,
} from "@/src/contexts/profile_devices/entities/profile_devices.entity";
import { ProfileDevicesService } from "@/src/contexts/profile_devices/services/profile-devices.service";

import {
  ExpoPushClient,
  is_invalid_expo_token_error,
} from "../clients/expo-push.client";
import {
  FcmPushClient,
  is_invalid_fcm_token_error,
} from "../clients/fcm-push.client";
import { PushMaintenanceEnqueueService } from "../queues/push-maintenance-enqueue.service";
import type { NotifyInput } from "../types/notify-input";
import { PUSH_CONFIG, type PushConfig } from "../types/push-config";
import type { PushDeliveryResult, PushMessage } from "../types/push-message";
import { build_push_message } from "./push-message.builder";
import { PushBadgeService } from "./push-badge.service";

const mask_token = (token: string): string => `***${token.slice(-6)}`;

const classify_outcome = (
  ok: boolean,
  is_invalid_token: boolean,
): PushDeliveryResult["status"] => {
  if (ok) {
    return "sent";
  }
  return is_invalid_token ? "invalid_token" : "failed";
};

/**
 * Canal push. Contrato: **nunca lanza**. Un fallo aquí no debe romper el email ni el in-app
 * del mismo `notify()`.
 */
@Injectable()
export class NotificationPushChannelService {
  private readonly logger = new Logger(NotificationPushChannelService.name);

  constructor(
    @Inject(PUSH_CONFIG) private readonly config: PushConfig,
    private readonly profile_devices_service: ProfileDevicesService,
    private readonly fcm_client: FcmPushClient,
    private readonly expo_client: ExpoPushClient,
    private readonly badge_service: PushBadgeService,
    private readonly maintenance_enqueue_service: PushMaintenanceEnqueueService,
  ) {}

  async send(
    input: NotifyInput,
    options: { notification_id?: string | null } = {},
  ): Promise<void> {
    try {
      await this.deliver(input, options);
    } catch (error) {
      this.logger.error(
        `push.failed user=${input.profile_id ?? "-"} category=${input.category} error=${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async deliver(
    input: NotifyInput,
    options: { notification_id?: string | null },
  ): Promise<void> {
    if (!this.config.enabled || !input.profile_id) {
      return;
    }

    const allowed = this.config.allowed_user_ids;
    if (allowed.length > 0 && !allowed.includes(input.profile_id)) {
      return;
    }

    const message = build_push_message(input, {
      notification_id: options.notification_id,
    });
    if (!message) {
      return;
    }

    const devices = await this.profile_devices_service.findActiveByUserId(
      input.profile_id,
    );
    if (devices.length === 0) {
      return;
    }

    if (this.config.dry_run) {
      for (const device of devices) {
        this.logger.log(
          `push.dry-run user=${message.user_id} device=${device.id} type=${message.type} provider=${device.tokenType}`,
        );
      }
      return;
    }

    const fcm_devices = devices.filter((d) => d.tokenType === PushTokenType.FCM);
    const expo_devices = devices.filter((d) => d.tokenType === PushTokenType.EXPO);

    const results: PushDeliveryResult[] = [];
    if (fcm_devices.length > 0) {
      results.push(...(await this.send_fcm(fcm_devices, message)));
    }
    if (expo_devices.length > 0) {
      results.push(...(await this.send_expo(expo_devices, message)));
    }

    await this.handle_results(message, results);
  }

  private async send_fcm(
    devices: ProfileDevices[],
    message: PushMessage,
  ): Promise<PushDeliveryResult[]> {
    const outcomes = await this.fcm_client.send_each(
      devices.map((device) => ({ token: device.token, message })),
    );

    return devices.map((device, index) => {
      const outcome = outcomes[index];
      const status = classify_outcome(
        outcome.ok,
        is_invalid_fcm_token_error(outcome.code, outcome.error_message),
      );
      return {
        device_id: device.id,
        token: device.token,
        token_type: "fcm",
        status,
        code: outcome.code,
      };
    });
  }

  private async send_expo(
    devices: ProfileDevices[],
    message: PushMessage,
  ): Promise<PushDeliveryResult[]> {
    const badge = await this.resolve_badge(message.user_id);
    const expo_message: PushMessage =
      badge === undefined ? message : { ...message, badge };

    const outcomes = await this.expo_client.send_each(
      devices.map((device) => ({ token: device.token, message: expo_message })),
    );

    return devices.map((device, index) => {
      const outcome = outcomes[index];
      const status = classify_outcome(
        outcome.ok,
        is_invalid_expo_token_error(outcome.code),
      );
      return {
        device_id: device.id,
        token: device.token,
        token_type: "expo",
        status,
        code: outcome.code,
        expo_ticket_id: outcome.ticket_id,
      };
    });
  }

  private async resolve_badge(user_id: string): Promise<number | undefined> {
    try {
      return await this.badge_service.compute_for_user(user_id);
    } catch {
      return undefined;
    }
  }

  private async handle_results(
    message: PushMessage,
    results: PushDeliveryResult[],
  ): Promise<void> {
    for (const result of results) {
      const line = `push.sent user=${message.user_id} device=${result.device_id} type=${message.type} provider=${result.token_type} token=${mask_token(result.token)} result=${result.status} code=${result.code}`;
      if (result.status === "sent") {
        this.logger.log(line);
      } else {
        this.logger.warn(line);
      }
    }

    const delivered_ids = results
      .filter((r) => r.status === "sent")
      .map((r) => r.device_id);
    const invalid_tokens = results
      .filter((r) => r.status === "invalid_token")
      .map((r) => r.token);
    const receipt_items = results.flatMap((r) =>
      r.status === "sent" && r.expo_ticket_id
        ? [{ ticket_id: r.expo_ticket_id, token: r.token }]
        : [],
    );

    await Promise.allSettled([
      this.profile_devices_service.markDelivered(delivered_ids),
      ...invalid_tokens.map((token) =>
        this.profile_devices_service.deleteByToken(token),
      ),
      this.maintenance_enqueue_service.schedule_expo_receipts(receipt_items),
    ]);
  }
}

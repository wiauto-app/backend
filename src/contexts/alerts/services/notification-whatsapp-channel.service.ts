import { Injectable, Logger } from "@nestjs/common";

import { TypeOrmProfileRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-repository";

import { WhatsAppCloudClient } from "../clients/whatsapp-cloud.client";
import type { NotifyInput } from "../types/notify-input";

const TITLE_MAX_LENGTH = 60;
const BODY_MAX_LENGTH = 80;

export const normalizeWhatsAppTo = (
  phone_code: string | null | undefined,
  phone: string | null | undefined,
): string | null => {
  if (!phone_code?.trim() || !phone?.trim()) {
    return null;
  }

  const digits = `${phone_code}${phone}`.replaceAll(/\D/g, "");
  return digits.length > 0 ? digits : null;
};

@Injectable()
export class NotificationWhatsappChannelService {
  private readonly logger = new Logger(NotificationWhatsappChannelService.name);

  constructor(
    private readonly profile_repository: TypeOrmProfileRepository,
    private readonly whatsapp_client: WhatsAppCloudClient,
  ) {}

  async send(input: NotifyInput): Promise<void> {
    try {
      const profile = await this.profile_repository.findOne(input.profile_id);
      if (!profile) {
        this.logger.warn(
          `WhatsApp omitido: profile ${input.profile_id} no encontrado`,
        );
        return;
      }

    
      const to = normalizeWhatsAppTo(profile.phone_code, profile.phone);
      console.log(to);
      if (!to) {
        this.logger.debug(
          `WhatsApp omitido: profile ${input.profile_id} sin teléfono`,
        );
        return;
      }

      const body_parameters = this.mapTemplateBodyParameters(input);
      await this.whatsapp_client.sendTemplateMessage({
        to,
        body_parameters,
      });
    } catch (error) {
      this.whatsapp_client.logSendFailure(
        `WhatsApp falló para profile ${input.profile_id} (${input.category})`,
        error,
      );
    }
  }

  private mapTemplateBodyParameters(
    input: NotifyInput,
  ): [string, string, string] {
    const data = input.data ?? {};
    const title = this.truncate(input.title, TITLE_MAX_LENGTH);

    const second =
      this.asNonEmptyString(data.lead_id) ??
      this.asNonEmptyString(data.vehicle_id) ??
      this.asNonEmptyString(data.category) ??
      input.category;

    const third =
      this.formatShortDate(data) ??
      this.truncate(input.body, BODY_MAX_LENGTH);

    return [title || "-", second || "-", third || "-"];
  }

  private asNonEmptyString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private formatShortDate(data: Record<string, unknown>): string | null {
    const raw =
      this.asNonEmptyString(data.created_at) ??
      this.asNonEmptyString(data.date) ??
      this.asNonEmptyString(data.callback_scheduled_at);

    if (!raw) {
      return null;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      return this.truncate(raw, BODY_MAX_LENGTH);
    }

    return parsed.toISOString().slice(0, 10);
  }

  private truncate(value: string, max_length: number): string {
    const trimmed = value.trim();
    if (trimmed.length <= max_length) {
      return trimmed;
    }
    return `${trimmed.slice(0, max_length - 1)}…`;
  }
}

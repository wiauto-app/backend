import { Injectable, Logger } from "@nestjs/common";

import type { NotifyInput } from "../types/notify-input";

@Injectable()
export class NotificationPushChannelStubService {
  private readonly logger = new Logger(NotificationPushChannelStubService.name);

  async send(input: NotifyInput): Promise<void> {
    this.logger.log(
      `Push stub: ${input.category} para profile ${input.profile_id} (sin envío real)`,
    );
  }
}

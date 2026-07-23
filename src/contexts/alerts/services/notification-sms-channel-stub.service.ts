import { Injectable, Logger } from "@nestjs/common";

import type { NotifyInput } from "../types/notify-input";

@Injectable()
export class NotificationSmsChannelStubService {
  private readonly logger = new Logger(NotificationSmsChannelStubService.name);

  async send(input: NotifyInput): Promise<void> {
    this.logger.log(
      `SMS stub: ${input.category} para profile ${input.profile_id} (sin envío real)`,
    );
  }
}

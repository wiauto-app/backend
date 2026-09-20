import { InjectQueue, Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Job, Queue } from "bullmq";

import { ProfileDevicesService } from "@/src/contexts/profile_devices/services/profile-devices.service";

import {
  ExpoPushClient,
  is_invalid_expo_token_error,
} from "../clients/expo-push.client";
import { PUSH_CONFIG, type PushConfig } from "../types/push-config";
import {
  PUSH_JOB_EXPO_RECEIPTS,
  PUSH_JOB_STALE_DEVICES,
  PUSH_MAINTENANCE_QUEUE,
  type PushExpoReceiptsJobData,
} from "./push-maintenance.queue.constants";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Processor(PUSH_MAINTENANCE_QUEUE)
@Injectable()
export class PushMaintenanceProcessor extends WorkerHost {
  private readonly logger = new Logger(PushMaintenanceProcessor.name);

  constructor(
    @Inject(PUSH_CONFIG) private readonly config: PushConfig,
    private readonly expo_client: ExpoPushClient,
    private readonly profile_devices_service: ProfileDevicesService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === PUSH_JOB_EXPO_RECEIPTS) {
      await this.process_expo_receipts(job.data as PushExpoReceiptsJobData);
      return;
    }

    if (job.name === PUSH_JOB_STALE_DEVICES) {
      await this.process_stale_devices();
      return;
    }

    throw new Error(`Trabajo de mantenimiento de push desconocido: ${job.name}`);
  }

  private async process_expo_receipts(data: PushExpoReceiptsJobData): Promise<void> {
    const token_by_ticket = new Map(
      data.items.map((item) => [item.ticket_id, item.token]),
    );
    const receipts = await this.expo_client.get_receipts([
      ...token_by_ticket.keys(),
    ]);

    for (const receipt of receipts) {
      if (receipt.ok) {
        continue;
      }
      const token = token_by_ticket.get(receipt.ticket_id);
      if (token && is_invalid_expo_token_error(receipt.code)) {
        await this.profile_devices_service.deleteByToken(token);
      }
      this.logger.warn(
        `push.receipt ticket=${receipt.ticket_id} result=failed code=${receipt.code}`,
      );
    }
  }

  private async process_stale_devices(): Promise<void> {
    if (this.config.stale_device_days <= 0) {
      return;
    }
    const before = new Date(Date.now() - this.config.stale_device_days * ONE_DAY_MS);
    const deleted = await this.profile_devices_service.deleteStale(before);
    this.logger.log(`push.cleanup stale_devices_deleted=${deleted}`);
  }
}

@Injectable()
export class PushMaintenanceBootstrapService implements OnModuleInit {
  constructor(
    @Inject(PUSH_CONFIG) private readonly config: PushConfig,
    @InjectQueue(PUSH_MAINTENANCE_QUEUE)
    private readonly push_maintenance_queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.config.stale_device_days <= 0) {
      return;
    }

    await this.push_maintenance_queue.add(
      PUSH_JOB_STALE_DEVICES,
      {},
      {
        repeat: { pattern: "0 4 * * *" },
        jobId: PUSH_JOB_STALE_DEVICES,
        removeOnComplete: true,
        removeOnFail: 100,
      },
    );
  }
}

import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Job } from "bullmq";

import { AlertNotificationService } from "../services/alert-notification.service";
import {
  ALERT_DIGEST_JOB_DAILY,
  ALERT_DIGEST_JOB_REMINDERS,
  ALERT_DIGEST_JOB_WEEKLY,
  ALERT_DIGEST_QUEUE,
} from "./alert-processing.queue.constants";
import { AlertDigestEnqueueService } from "./alert-processing-enqueue.service";

@Injectable()
export class AlertDigestBootstrapService implements OnModuleInit {
  constructor(
    private readonly alert_digest_enqueue_service: AlertDigestEnqueueService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.alert_digest_enqueue_service.schedule_recurring_jobs();
  }
}

@Processor(ALERT_DIGEST_QUEUE)
@Injectable()
export class AlertDigestProcessor extends WorkerHost {
  constructor(
    private readonly alert_notification_service: AlertNotificationService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === ALERT_DIGEST_JOB_DAILY) {
      await this.alert_notification_service.sendDigest({ frequency: "daily" });
      return;
    }

    if (job.name === ALERT_DIGEST_JOB_WEEKLY) {
      await this.alert_notification_service.sendDigest({ frequency: "weekly" });
      return;
    }

    if (job.name === ALERT_DIGEST_JOB_REMINDERS) {
      await this.alert_notification_service.processSavedVehicleReminders();
      return;
    }

    throw new Error(`Trabajo de digest de alertas desconocido: ${job.name}`);
  }
}

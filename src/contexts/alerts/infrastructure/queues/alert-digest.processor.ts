import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { Job } from "bullmq";

import { ProcessSavedVehicleRemindersUseCase } from "../../application/process-saved-vehicle-reminders-use-case/process-saved-vehicle-reminders.use-case";
import { SendAlertDigestUseCase } from "../../application/send-alert-digest-use-case/send-alert-digest.use-case";
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
    private readonly send_alert_digest_use_case: SendAlertDigestUseCase,
    private readonly process_saved_vehicle_reminders_use_case: ProcessSavedVehicleRemindersUseCase,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === ALERT_DIGEST_JOB_DAILY) {
      await this.send_alert_digest_use_case.execute({ frequency: "daily" });
      return;
    }

    if (job.name === ALERT_DIGEST_JOB_WEEKLY) {
      await this.send_alert_digest_use_case.execute({ frequency: "weekly" });
      return;
    }

    if (job.name === ALERT_DIGEST_JOB_REMINDERS) {
      await this.process_saved_vehicle_reminders_use_case.execute();
      return;
    }

    throw new Error(`Trabajo de digest de alertas desconocido: ${job.name}`);
  }
}

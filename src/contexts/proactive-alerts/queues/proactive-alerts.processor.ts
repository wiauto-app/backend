import { Processor, WorkerHost } from "@nestjs/bullmq";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";

import { VehicleEntity } from "@/src/contexts/vehicles/entities/vehicle.entity";
import { STATUS_VEHICLE } from "@/src/contexts/vehicles/types/vehicle";

import { ProactiveAlertEvaluatorService } from "../services/proactive-alert-evaluator.service";
import { ProactiveAlertEventService } from "../services/proactive-alert-event.service";
import {
  PROACTIVE_ALERTS_JOB_DAILY,
  PROACTIVE_ALERTS_JOB_HOT_LEAD,
  PROACTIVE_ALERTS_JOB_VEHICLE_PUBLISHED,
  PROACTIVE_ALERTS_JOB_WEEKLY,
  PROACTIVE_ALERTS_QUEUE,
  type ProactiveAlertsDailyJobData,
  type ProactiveAlertsHotLeadJobData,
  type ProactiveAlertsVehiclePublishedJobData,
} from "./proactive-alerts.queue.constants";

@Processor(PROACTIVE_ALERTS_QUEUE)
export class ProactiveAlertsProcessor extends WorkerHost {
  constructor(
    private readonly evaluator_service: ProactiveAlertEvaluatorService,
    private readonly event_service: ProactiveAlertEventService,
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === PROACTIVE_ALERTS_JOB_DAILY) {
      const data = job.data as ProactiveAlertsDailyJobData;
      if (data.profile_id) {
        await this.evaluator_service.runDailyBatchForProfile(data.profile_id);
        return;
      }
      const sellers = await this.vehicle_repository
        .createQueryBuilder("vehicle")
        .select("DISTINCT vehicle.profile_id", "profile_id")
        .where("vehicle.status = :status", { status: STATUS_VEHICLE.ACTIVE })
        .getRawMany<{ profile_id: string }>();
      for (const row of sellers) {
        await this.evaluator_service.runDailyBatchForProfile(row.profile_id);
      }
      return;
    }

    if (job.name === PROACTIVE_ALERTS_JOB_WEEKLY) {
      const sellers = await this.vehicle_repository
        .createQueryBuilder("vehicle")
        .select("DISTINCT vehicle.profile_id", "profile_id")
        .where("vehicle.status = :status", { status: STATUS_VEHICLE.ACTIVE })
        .getRawMany<{ profile_id: string }>();
      for (const row of sellers) {
        await this.evaluator_service.runWeeklySummaryForProfile(row.profile_id);
      }
      return;
    }

    if (job.name === PROACTIVE_ALERTS_JOB_HOT_LEAD) {
      const data = job.data as ProactiveAlertsHotLeadJobData;
      await this.event_service.runHotLeadUnansweredCheck(data.lead_id);
      return;
    }

    if (job.name === PROACTIVE_ALERTS_JOB_VEHICLE_PUBLISHED) {
      const data = job.data as ProactiveAlertsVehiclePublishedJobData;
      void data;
    }
  }
}

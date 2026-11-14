import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { VehiclePostCommitService } from "../services/vehicle-post-commit.service";
import {
  VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA,
  VEHICLE_POST_COMMIT_QUEUE,
  VehiclePostCommitJobData,
} from "./vehicle-post-commit.queue.constants";

@Processor(VEHICLE_POST_COMMIT_QUEUE, { concurrency: 2 })
@Injectable()
export class VehiclePostCommitProcessor extends WorkerHost {
  private readonly logger = new Logger(VehiclePostCommitProcessor.name);

  constructor(
    private readonly vehicle_post_commit_service: VehiclePostCommitService,
  ) {
    super();
  }

  async process(job: Job<VehiclePostCommitJobData>): Promise<void> {
    if (job.name !== VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA) {
      throw new Error(`Trabajo post-commit de vehículo desconocido: ${job.name}`);
    }

    try {
      await this.vehicle_post_commit_service.execute(job.data);
    } catch (error) {
      this.logger.error(
        `Falló el post-commit del vehículo ${job.data.vehicle_id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
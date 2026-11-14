import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import {
  VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA,
  VEHICLE_POST_COMMIT_QUEUE,
  vehiclePostCommitJobId,
  VehiclePostCommitJobData,
} from "../queues/vehicle-post-commit.queue.constants";

@Injectable()
export class VehiclePostCommitEnqueueService {
  private readonly logger = new Logger(VehiclePostCommitEnqueueService.name);

  constructor(
    @InjectQueue(VEHICLE_POST_COMMIT_QUEUE)
    private readonly vehicle_post_commit_queue: Queue<VehiclePostCommitJobData>,
  ) {}

  async enqueue(data: VehiclePostCommitJobData): Promise<void> {
    try {
      await this.vehicle_post_commit_queue.add(
        VEHICLE_POST_COMMIT_JOB_PROCESS_MEDIA,
        data,
        {
          jobId: vehiclePostCommitJobId(data.vehicle_id),
          attempts: 3,
          backoff: { type: "exponential", delay: 3_000 },
        },
      );
    } catch (error) {
      this.logger.error(
        `No se pudo encolar post-commit del vehículo ${data.vehicle_id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

import type { CreateVehicleDto } from "../api/v1/create-vehicle/create-vehicle.http-dto";
import { TempUploadService } from "../vehicle-images/services/temp-upload.service";
import {
  PENDING_VEHICLE_CREATION_JOB_CREATE_DRAFT,
  PENDING_VEHICLE_CREATION_QUEUE,
  PendingVehicleCreationJobData,
} from "../queues/pending-vehicle-creation.queue.constants";

@Injectable()
export class PendingVehicleCreationEnqueueService {
  constructor(
    @InjectQueue(PENDING_VEHICLE_CREATION_QUEUE)
    private readonly pending_vehicle_creation_queue: Queue<PendingVehicleCreationJobData>,
    private readonly temp_upload_service: TempUploadService,
  ) {}

  async enqueueForProfile(
    profile_id: string,
    guest_id: string | null,
    vehicle: CreateVehicleDto,
  ): Promise<void> {
    const guest_id_from_uploads =
      await this.temp_upload_service.resolveGuestIdFromVehicleImages(
        vehicle.images,
      );
    const effective_guest_id = guest_id_from_uploads ?? guest_id;

    await this.pending_vehicle_creation_queue.add(
      PENDING_VEHICLE_CREATION_JOB_CREATE_DRAFT,
      {
        profile_id,
        guest_id: effective_guest_id,
        vehicle,
      },
      { attempts: 3, backoff: { type: "exponential", delay: 3_000 } },
    );
  }
}

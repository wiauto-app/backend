import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";

import { CreateVehicleService } from "../api/v1/create-vehicle/create-vehicle.service";
import {
  DraftVehiclePublicationService,
  VEHICLE_LISTING_LIFETIME_MS,
} from "../services/draft-vehicle-publication.service";
import {
  DRAFT_PUBLICATION_ON_VERIFY_JOB,
  DRAFT_PUBLICATION_ON_VERIFY_QUEUE,
  DraftPublicationOnVerifyJobData,
} from "./draft-publication-on-verify.queue.constants";

@Processor(DRAFT_PUBLICATION_ON_VERIFY_QUEUE)
@Injectable()
export class DraftPublicationOnVerifyProcessor extends WorkerHost {
  constructor(
    private readonly draft_vehicle_publication_service: DraftVehiclePublicationService,
    private readonly create_vehicle_service: CreateVehicleService,
  ) {
    super();
  }

  async process(job: Job<DraftPublicationOnVerifyJobData>): Promise<void> {
    if (job.name !== DRAFT_PUBLICATION_ON_VERIFY_JOB) {
      throw new Error(
        `Trabajo de publicación tras verificación desconocido: ${job.name}`,
      );
    }

    const published_vehicle_id =
      await this.draft_vehicle_publication_service.publishDraftsForProfile(
        job.data.profile_id,
      );

    if (!published_vehicle_id) {
      return;
    }

    const now = new Date();
    const expires_at = new Date(now.getTime() + VEHICLE_LISTING_LIFETIME_MS);
    await this.create_vehicle_service.runLiveListingSideEffects({
      vehicle_id: published_vehicle_id,
      publisher_profile_id: job.data.profile_id,
      expires_at,
      now,
    });
  }
}

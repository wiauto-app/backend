import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Job } from "bullmq";
import { Repository } from "typeorm";

import { User } from "@/src/contexts/users/entities/user.entity";

import { CreateVehicleService } from "../api/v1/create-vehicle/create-vehicle.service";
import {
  DraftVehiclePublicationService,
  VEHICLE_LISTING_LIFETIME_MS,
} from "../services/draft-vehicle-publication.service";
import { TempUploadService } from "../vehicle-images/services/temp-upload.service";
import {
  PENDING_VEHICLE_CREATION_JOB_CREATE_DRAFT,
  PENDING_VEHICLE_CREATION_QUEUE,
  PendingVehicleCreationJobData,
} from "./pending-vehicle-creation.queue.constants";

@Processor(PENDING_VEHICLE_CREATION_QUEUE)
@Injectable()
export class PendingVehicleCreationProcessor extends WorkerHost {
  private readonly logger = new Logger(PendingVehicleCreationProcessor.name);

  constructor(
    private readonly create_vehicle_service: CreateVehicleService,
    private readonly draft_vehicle_publication_service: DraftVehiclePublicationService,
    private readonly temp_upload_service: TempUploadService,
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
  ) {
    super();
  }

  async process(job: Job<PendingVehicleCreationJobData>): Promise<void> {
    if (job.name !== PENDING_VEHICLE_CREATION_JOB_CREATE_DRAFT) {
      throw new Error(
        `Trabajo de creación de vehículo pendiente desconocido: ${job.name}`,
      );
    }

    const { profile_id, guest_id, vehicle } = job.data;
    try {
      const guest_id_from_uploads =
        await this.temp_upload_service.resolveGuestIdFromVehicleImages(
          vehicle.images,
        );
      const effective_guest_id = guest_id_from_uploads ?? guest_id;

      const now = new Date();
      const created = await this.create_vehicle_service.create(
        vehicle,
        profile_id,
        effective_guest_id,
        { as_draft: true },
      );

      await this.create_vehicle_service.runDraftRegistrationSideEffects({
        vehicle_id: created.id,
        expires_at: created.expires_at,
        now,
      });

      const user = await this.user_repository.findOne({
        where: { id: profile_id },
        select: { id: true, is_email_verified: true },
      });

      if (user?.is_email_verified) {
        const published_vehicle_id =
          await this.draft_vehicle_publication_service.publishDraftsForProfile(
            profile_id,
          );
        if (published_vehicle_id) {
          const activated_at = new Date();
          const expires_at = new Date(
            activated_at.getTime() + VEHICLE_LISTING_LIFETIME_MS,
          );
          await this.create_vehicle_service.runLiveListingSideEffects({
            vehicle_id: published_vehicle_id,
            publisher_profile_id: profile_id,
            expires_at,
            now: activated_at,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `No se pudo crear el borrador del perfil ${profile_id}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}

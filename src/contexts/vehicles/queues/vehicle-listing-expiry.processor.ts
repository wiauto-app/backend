import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";

import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { buildMailVehicleCard } from "@/src/contexts/shared/mail/mail-vehicle-card";
import { TypeOrmProfileUserRepository } from "@/src/contexts/profiles/repositories/typeorm.profile-user-repository";

import { applyVehicleUpdates, STATUS_VEHICLE } from "../types/vehicle";
import { formatVehicleDisplayName } from "../utils/format-vehicle-display-name";
import { TypeOrmVehicleRepository } from "../repositories/typeorm.vehicle-repository";
import { VehicleSearchIndexer } from "../search/indexing/vehicle-search-indexer.service";
import { vehicleDetailToPrimitives } from "../types/vehicle-detail";
import {
  VEHICLE_LISTING_EXPIRY_JOB_EXPIRE,
  VEHICLE_LISTING_EXPIRY_JOB_WARN,
  VEHICLE_LISTING_EXPIRY_QUEUE,
  type VehicleListingExpiryJobData,
} from "./vehicle-listing-expiry.queue.constants";

@Processor(VEHICLE_LISTING_EXPIRY_QUEUE)
@Injectable()
export class VehicleListingExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(VehicleListingExpiryProcessor.name);

  constructor(
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
    private readonly profile_user_repository: TypeOrmProfileUserRepository,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
  ) {
    super();
  }

  async process(job: Job<VehicleListingExpiryJobData>): Promise<void> {
    if (job.name === VEHICLE_LISTING_EXPIRY_JOB_WARN) {
      await this.handleWarn(job.data.vehicle_id);
      return;
    }

    if (job.name === VEHICLE_LISTING_EXPIRY_JOB_EXPIRE) {
      await this.handleExpire(job.data.vehicle_id);
      return;
    }

    throw new Error(`Trabajo de caducidad de listing desconocido: ${job.name}`);
  }

  private async handleWarn(vehicle_id: string): Promise<void> {
    const detail = await this.vehicle_repository.findOne(vehicle_id);
    if (!detail) {
      return;
    }

    if (detail.status !== STATUS_VEHICLE.ACTIVE) {
      return;
    }

    const now = new Date();
    if (detail.expires_at.getTime() <= now.getTime()) {
      return;
    }

    const publisher_email = detail.profile_id
      ? await this.profile_user_repository.findEmailById(detail.profile_id)
      : null;
    if (!publisher_email) {
      return;
    }

    const vehicle_card = this.buildCardFromDetail(detail);
    const expires_at_label = detail.expires_at.toLocaleDateString("es-ES", {
      dateStyle: "long",
    });

    await this.outbound_mail_enqueue_service.enqueue_vehicle_expiry_warning({
      to: publisher_email,
      vehicle: vehicle_card,
      expires_at_label,
    });
  }

  private async handleExpire(vehicle_id: string): Promise<void> {
    const detail = await this.vehicle_repository.findOne(vehicle_id);
    if (!detail) {
      return;
    }

    const now = new Date();
    if (detail.status !== STATUS_VEHICLE.ACTIVE) {
      return;
    }

    if (detail.expires_at.getTime() > now.getTime()) {
      this.logger.debug(
        `Omitiendo expire de ${vehicle_id}: expires_at aún futura`,
      );
      return;
    }

    // inactive sin status_change_message = desactivado por caducidad (no rechazo)
    const updated = applyVehicleUpdates(vehicleDetailToPrimitives(detail), {
      status: STATUS_VEHICLE.INACTIVE,
      status_change_message: null,
    });

    await this.vehicle_repository.update(updated);
    await this.vehicle_search_indexer.syncVehicle(
      vehicle_id,
      STATUS_VEHICLE.INACTIVE,
    );

    const publisher_email = detail.profile_id
      ? await this.profile_user_repository.findEmailById(detail.profile_id)
      : null;
    if (!publisher_email) {
      return;
    }

    const vehicle_card = this.buildCardFromDetail(detail);
    const expires_at_label = detail.expires_at.toLocaleDateString("es-ES", {
      dateStyle: "long",
    });

    await this.outbound_mail_enqueue_service.enqueue_vehicle_expired({
      to: publisher_email,
      vehicle: vehicle_card,
      expires_at_label,
    });
  }

  private buildCardFromDetail(
    detail: NonNullable<
      Awaited<ReturnType<TypeOrmVehicleRepository["findOne"]>>
    >,
  ) {
    const title = formatVehicleDisplayName({
      make_name: detail.version.make.name,
      model_name: detail.version.model.name,
      version_name: detail.version.name,
    });

    return buildMailVehicleCard({
      id: detail.id,
      title,
      price: detail.price ?? null,
      image_url: detail.images[0]?.url ?? null,
      year: detail.version.year?.year ?? null,
      mileage: detail.mileage ?? null,
      fuel_type_slug: detail.version.fuel_type?.slug,
      transmission_type: detail.transmission_type,
      location_label: detail.address ?? undefined,
      publisher_type: detail.publisher_type,
    });
  }
}

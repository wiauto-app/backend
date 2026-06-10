import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";

import {
  STATUS_VEHICLE,
  StatusVehicle,
  Vehicle,
} from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { vehicleDetailToPrimitives } from "../../../domain/read-models/vehicle-detail";
import { VehicleRepository } from "../../../domain/repositories/vehicle.repository";
import { VehicleSearchIndexer } from "../../../search/infrastructure/indexing/vehicle-search-indexer.service";
import { AdminUpdateVehicleStatusDto } from "./admin-update-vehicle-status.dto";

const STATUS_LABELS: Record<StatusVehicle, string> = {
  active: "Activo",
  pending: "Pendiente",
  inactive: "Inactivo",
  sold: "Vendido",
  archived: "Archivado",
};

@Injectable()
export class AdminUpdateVehicleStatusUseCase {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    private readonly profile_user_repository: ProfileUserRepository,
    private readonly outbound_mail_enqueue_service: OutboundMailEnqueueService,
    private readonly alert_processing_enqueue_service: AlertProcessingEnqueueService,
    private readonly vehicle_search_indexer: VehicleSearchIndexer,
  ) {}

  async execute(dto: AdminUpdateVehicleStatusDto) {
    const existing = await this.vehicle_repository.findOne(dto.vehicle_id);
    if (!existing) {
      throw new VehicleNotFoundException(dto.vehicle_id);
    }

    const previous_status = existing.status;
    const new_status = dto.status;

    if (previous_status === new_status) {
      return { vehicle: vehicleDetailToPrimitives(existing) };
    }

    const status_change_message =
      new_status === STATUS_VEHICLE.ACTIVE
        ? null
        : (dto.message?.trim() || null);

    const updated = Vehicle.fromPrimitives(
      vehicleDetailToPrimitives(existing),
    ).applyUpdates({
      status: new_status,
      status_change_message,
    });

    await this.vehicle_repository.update(updated);

    const publisher_email = existing.profile_id
      ? await this.profile_user_repository.findEmailById(existing.profile_id)
      : null;

    if (publisher_email) {
      await this.outbound_mail_enqueue_service.enqueue_vehicle_status_changed({
        to: publisher_email,
        vehicle_title: existing.title,
        previous_status_label: STATUS_LABELS[previous_status],
        new_status_label: STATUS_LABELS[new_status],
        status_change_message,
      });
    }

    if (new_status === STATUS_VEHICLE.ACTIVE) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_published({
        vehicle_id: dto.vehicle_id,
      });
    }

    await this.vehicle_search_indexer.syncVehicle(dto.vehicle_id, new_status);

    return { vehicle: updated.toPrimitives() };
  }
}

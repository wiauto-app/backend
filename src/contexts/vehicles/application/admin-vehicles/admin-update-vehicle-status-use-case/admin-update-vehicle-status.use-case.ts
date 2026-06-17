import { Injectable } from "@/src/contexts/shared/dependency-injectable/injectable";
import { OutboundMailEnqueueService } from "@/src/contexts/shared/mail/outbound-mail-enqueue.service";
import { ProfileUserRepository } from "@/src/contexts/profiles/domain/repositories/profile-user.repository";
import { AlertProcessingEnqueueService } from "@/src/contexts/alerts/infrastructure/queues/alert-processing-enqueue.service";
import { ALERT_EVENT_TYPE } from "@/src/contexts/alerts/domain/enums/alert-event-type.enum";

import {
  STATUS_VEHICLE,
  StatusVehicle,
  Vehicle,
} from "../../../domain/entities/vehicle";
import { VehicleNotFoundException } from "../../../domain/exceptions/vehicle-not-found.exception";
import { vehicleDetailToPrimitives } from "../../../domain/read-models/vehicle-detail";
import { formatVehicleDisplayName } from "../../../domain/utils/format-vehicle-display-name";
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
        vehicle_title: formatVehicleDisplayName({
          make_name: existing.version.make.name,
          model_name: existing.version.model.name,
          version_name: existing.version.name,
        }),
        previous_status_label: STATUS_LABELS[previous_status],
        new_status_label: STATUS_LABELS[new_status],
        status_change_message,
      });
    }

    if (new_status === STATUS_VEHICLE.ACTIVE) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.NEW_LISTING,
      });

      const updated_primitive = updated.toPrimitives();
      if (updated_primitive.is_featured) {
        await this.alert_processing_enqueue_service.enqueue_vehicle_event({
          vehicle_id: dto.vehicle_id,
          event_type: ALERT_EVENT_TYPE.FEATURED,
        });
      }
    }

    if (
      new_status === STATUS_VEHICLE.SOLD ||
      new_status === STATUS_VEHICLE.ARCHIVED ||
      new_status === STATUS_VEHICLE.INACTIVE
    ) {
      await this.alert_processing_enqueue_service.enqueue_vehicle_event({
        vehicle_id: dto.vehicle_id,
        event_type: ALERT_EVENT_TYPE.SOLD_REMOVED,
      });
    }

    await this.vehicle_search_indexer.syncVehicle(dto.vehicle_id, new_status);

    return { vehicle: updated.toPrimitives() };
  }
}

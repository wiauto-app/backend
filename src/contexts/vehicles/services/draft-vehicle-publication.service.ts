import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { VehicleEntity } from "../entities/vehicle.entity";
import { STATUS_VEHICLE } from "../types/vehicle";

const VEHICLE_LISTING_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000;

export { VEHICLE_LISTING_LIFETIME_MS };

@Injectable()
export class DraftVehiclePublicationService {
  private readonly logger = new Logger(DraftVehiclePublicationService.name);

  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehicle_repository: Repository<VehicleEntity>,
  ) {}

  /** Pasa borradores a active; devuelve el id del más reciente activado. */
  async publishDraftsForProfile(profile_id: string): Promise<string | null> {
    const drafts = await this.vehicle_repository.find({
      where: {
        profile_id,
        status: STATUS_VEHICLE.DRAFT,
      },
      order: { created_at: "DESC" },
    });

    if (drafts.length === 0) {
      return null;
    }

    const now = new Date();
    const expires_at = new Date(now.getTime() + VEHICLE_LISTING_LIFETIME_MS);
    let latestPublishedId: string | null = null;
    let latestCreatedAtMs = 0;

    for (const draft of drafts) {
      try {
        const updated = await this.vehicle_repository.preload({
          id: draft.id,
          status: STATUS_VEHICLE.ACTIVE,
          expires_at,
          scheduled_publish_at: null,
          status_change_message: null,
        });

        if (!updated) {
          continue;
        }

        await this.vehicle_repository.save(updated);
        const createdAtMs = new Date(draft.created_at).getTime();
        if (createdAtMs >= latestCreatedAtMs) {
          latestCreatedAtMs = createdAtMs;
          latestPublishedId = updated.id;
        }
      } catch (error) {
        this.logger.error(
          `No se pudo publicar el borrador ${draft.id} del perfil ${profile_id}`,
          error,
        );
      }
    }

    return latestPublishedId;
  }
}

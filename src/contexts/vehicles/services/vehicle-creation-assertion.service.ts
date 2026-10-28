import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { ForbiddenException, Injectable } from "@nestjs/common";

import type { CreateVehicleDto } from "../api/v1/create-vehicle/create-vehicle.http-dto";

interface AssertCanCreateVehicleOptions {
  is_admin?: boolean;
}

@Injectable()
export class VehicleCreationAssertionService {
  constructor(
    private readonly entitlements_service: EntitlementsService,
  ) {}

  async assertCanCreateVehicle(
    profile_id: string,
    dto: CreateVehicleDto,
    options: AssertCanCreateVehicleOptions = {},
  ): Promise<void> {
    if (options.is_admin) {
      return;
    }

    const billingSummary =
      await this.entitlements_service.getBillingMe(profile_id);
    const vehicleSlotsUsed = billingSummary.usage.listings_used;
    const entitlements = billingSummary.entitlements;

    const maxVehicles = entitlements.vehicles.limit;
    const maxImages = entitlements.photos_per_vehicle.limit;
    const maxVideos = entitlements.videos_per_vehicle.limit;
    const canUploadVideos =
      maxVideos == null || (typeof maxVideos === "number" && maxVideos > 0);

    if (maxVehicles && vehicleSlotsUsed >= maxVehicles) {
      throw new ForbiddenException("Has alcanzado el límite de vehículos");
    }

    if (!maxImages && maxImages !== 0) {
      throw new ForbiddenException("No tienes permitido subir imágenes");
    }

    const imagesCount = dto.images?.length;
    if (imagesCount && imagesCount > maxImages) {
      throw new ForbiddenException("Tienes más imágenes que las permitidas");
    }

    const videosCount = dto.videos?.length;
    if (!canUploadVideos && videosCount && videosCount > 0) {
      throw new ForbiddenException("No tienes permitido subir vídeos");
    }

    if (maxVideos != null && videosCount && videosCount > maxVideos) {
      throw new ForbiddenException("Tienes más vídeos que las permitidas");
    }
  }
}

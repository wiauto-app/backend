import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { BillingNotificationMailService } from "@/src/contexts/billing/services/billing-notification-mail.service";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { CreateVehicleHttpDto } from "../api/v1/create-vehicle/create-vehicle.http-dto";

/**
 * Valida la cuota de anuncios resuelta por plan del dealership /
 * suscripción propia / free (vía EntitlementsService).
 */
@Injectable()
export class VehicleCreationGuard implements CanActivate {
  private readonly logger = new Logger(VehicleCreationGuard.name);
  constructor(
    private readonly entitlements_service: EntitlementsService,
    private readonly billing_notification_mail_service: BillingNotificationMailService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }
    const body = context.switchToHttp().getRequest().body;
    const profile_id = user.id;
    if (user.is_admin) {
      const entitlements = await this.entitlements_service.resolve(profile_id);
      request.vehicle_listings_used = entitlements.listings_used;
      request.vehicle_listings_max = undefined;
      return true;
    }

    const billingSummary =
      await this.entitlements_service.getBillingMe(profile_id);
    const vehicleSlotsUsed = billingSummary.usage.listings_used;
    const entitlements = billingSummary.entitlements

    const maxVehicles = entitlements.vehicles.limit;
    const maxImages = entitlements.photos_per_vehicle.limit;
    const maxVideos = entitlements.videos_per_vehicle.limit;
    const canUploadVideos = entitlements.video_upload.value;

    if (maxVehicles && vehicleSlotsUsed >= maxVehicles) {
      throw new ForbiddenException("Has alcanzado el límite de vehículos");
    }
    
    if (!maxImages && maxImages !== 0) {
      throw new ForbiddenException("No tienes permitido subir imágenes");
    }
    const imagesCount = body.images?.length;
    
    if (imagesCount && imagesCount > maxImages) {
      throw new ForbiddenException("Tienes más imágenes que las permitidas");
    }
    
    if (!maxVideos && maxVideos !== 0) {
      throw new ForbiddenException("No tienes permitido subir vídeos");
    }
    const videosCount = body.videos?.length;

    if (!canUploadVideos && videosCount && videosCount > 0) {
      return false;
    }

    if (videosCount && videosCount > maxVideos) {
      throw new ForbiddenException("Tienes más vídeos que las permitidas");
    }


    return true;

  }
}

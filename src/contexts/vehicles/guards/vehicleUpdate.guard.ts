import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { TypeOrmVehicleRepository } from "../repositories/typeorm.vehicle-repository";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { DealershipMembersEntity } from "../../dealership/entities/dealership-members.entity";
import { VehiclePermissionsService } from "../api/v1/vehicle-permissions/vehicle-permissions.service";

/**
 * Valida:
 * - Que el usuario sea dueño del vehículo.
 * - O que sea miembro del dealership propietario del vehículo.
 * - Y posteriormente valida los límites del plan.
 */
@Injectable()
export class VehicleUpdateGuard implements CanActivate {
  constructor(
    private readonly entitlements_service: EntitlementsService,
    private readonly vehicle_repository: TypeOrmVehicleRepository,
    @InjectRepository(DealershipMembersEntity)
    private readonly dealershipMembersRepository: Repository<DealershipMembersEntity>,
    private readonly vehiclePermissionsService: VehiclePermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);

    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const vehicle_id = request.params.id as string | undefined;

    if (!vehicle_id) {
      throw new ForbiddenException("Identificador de vehículo no válido");
    }

    const vehicle = await this.vehicle_repository.findById(vehicle_id);

    if (!vehicle) {
      throw new NotFoundException("Vehículo no encontrado");
    }

    const profile_id = user.id;
    const canModifyVehicle = await this.vehiclePermissionsService.canModifyVehicle(vehicle_id, user.profile.id);


    if (!canModifyVehicle) {
      throw new ForbiddenException("No tienes permisos para actualizar este vehículo");
    }

    const body = request.body;

    if (user.is_admin) {
      const entitlements =
        await this.entitlements_service.resolve(profile_id);

      request.vehicle_listings_used = entitlements.listings_used;
      request.vehicle_listings_max = undefined;

      return true;
    }

    const billingSummary =
      await this.entitlements_service.getBillingMe(profile_id);

    const vehicleSlotsUsed = billingSummary.usage.listings_used;
    const entitlements = billingSummary.entitlements;

    const maxVehicles = entitlements.vehicles.limit;
    const maxImages = entitlements.photos_per_vehicle.limit;
    const maxVideos = entitlements.videos_per_vehicle.limit;
    const canUploadVideos = entitlements.video_upload.value;

    if (maxVehicles && vehicleSlotsUsed >= maxVehicles) {
      throw new ForbiddenException(
        "Has alcanzado el límite de vehículos",
      );
    }

    if (!maxImages && maxImages !== 0) {
      throw new ForbiddenException(
        "No tienes permitido subir imágenes",
      );
    }

    const imagesCount = body.images?.length ?? 0;

    if (imagesCount > maxImages) {
      throw new ForbiddenException(
        "Tienes más imágenes que las permitidas",
      );
    }

    if (!maxVideos && maxVideos !== 0) {
      throw new ForbiddenException(
        "No tienes permitido subir vídeos",
      );
    }

    const videosCount = body.videos?.length ?? 0;

    if (!canUploadVideos && videosCount > 0) {
      throw new ForbiddenException(
        "No tienes permitido subir vídeos",
      );
    }

    if (videosCount > maxVideos) {
      throw new ForbiddenException(
        "Tienes más vídeos que las permitidas",
      );
    }

    return true;
  }
}

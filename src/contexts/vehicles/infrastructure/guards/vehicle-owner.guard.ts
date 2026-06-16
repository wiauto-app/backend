import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { VehicleRepository } from "../../domain/repositories/vehicle.repository";

@Injectable()
export class VehicleOwnerGuard implements CanActivate {
  constructor(private readonly vehicle_repository: VehicleRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new ForbiddenException("Usuario no autenticado");
    }

    const vehicle_id = request.params.id as string | undefined;
    if (!vehicle_id) {
      throw new ForbiddenException("Identificador de vehículo no válido");
    }

    const vehicle = await this.vehicle_repository.findById(vehicle_id);
    if (!vehicle) {
      throw new NotFoundException("Vehículo no encontrado");
    }

    const primitive = vehicle.toPrimitives();
    if (primitive.profile_id !== user.id) {
      throw new ForbiddenException("No tienes permiso para gestionar este anuncio");
    }

    request.vehicle_owner_vehicle_id = vehicle_id;
    return true;
  }
}

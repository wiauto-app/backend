import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { VehicleRepository } from "@/src/contexts/vehicles/domain/repositories/vehicle.repository";
import { PermissionKeys } from "@/src/contexts/users/permissions/lib/available-permission";
import { Roles } from "@/src/contexts/roles/entities/roles.entity";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

/**
 * Tras `PermissionGuard` + `vehicles.create`, valida la cuota de anuncios:
 * el permiso `vehicles.create` en BD debe llevar `value` = máximo de vehículos activos por perfil (planes / cobro).
 */
@Injectable()
export class VehicleCreationGuard implements CanActivate {
  constructor(
    private readonly vehicle_repository: VehicleRepository,
    @InjectRepository(Roles)
    private readonly roles_repository: Repository<Roles>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const profile_id = user.id;
    const current_count =
      await this.vehicle_repository.count_active_by_profile_id(profile_id);

    const role = user.profile.role;
    if (!role?.id) {
      throw new UnauthorizedException("Rol no encontrado");
    }

    if (role.is_admin || role.is_developer) {
      request.vehicle_listings_used = current_count;
      request.vehicle_listings_max = undefined;
      return true;
    }

    const role_with_permissions = await this.roles_repository.findOne({
      where: { id: role.id },
      relations: { permissions: true },
    });
    if (!role_with_permissions) {
      throw new UnauthorizedException("Rol no encontrado");
    }

    const quota_permission = role_with_permissions.permissions.find(
      (permission) => permission.key === PermissionKeys.VEHICLES_CREATE,
    );

    const max_listings = quota_permission?.value;
    if (!(typeof max_listings === "number" && max_listings >= 1)) {
      throw new ForbiddenException(
        "Tu plan no tiene definida la cuota de anuncios: asigna un entero ≥ 1 en `value` del permiso vehicles.create.",
      );
    }

    if (current_count >= max_listings) {
      throw new ForbiddenException(
        `Has alcanzado el límite de anuncios activos de tu plan (${max_listings}).`,
      );
    }

    request.vehicle_listings_used = current_count;
    request.vehicle_listings_max = max_listings;
    return true;
  }
}

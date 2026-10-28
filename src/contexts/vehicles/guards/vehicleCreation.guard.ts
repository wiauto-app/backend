import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

import { VehicleCreationAssertionService } from "../services/vehicle-creation-assertion.service";

/**
 * Valida la cuota de anuncios resuelta por plan del dealership /
 * suscripción propia / free (vía EntitlementsService).
 */
@Injectable()
export class VehicleCreationGuard implements CanActivate {
  constructor(
    private readonly entitlements_service: EntitlementsService,
    private readonly vehicle_creation_assertion_service: VehicleCreationAssertionService,
  ) {}

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

    await this.vehicle_creation_assertion_service.assertCanCreateVehicle(
      profile_id,
      body,
    );

    return true;

  }
}

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";
import { EntitlementsService } from "@/src/contexts/billing/services/entitlements.service";
import { BillingNotificationMailService } from "@/src/contexts/billing/services/billing-notification-mail.service";
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Tras `PermissionGuard` + `vehicles.create`, valida la cuota de anuncios
 * resuelta por plan del dealership / suscripción propia / free.
 */
@Injectable()
export class VehicleCreationGuard implements CanActivate {
  constructor(
    private readonly entitlements_service: EntitlementsService,
    private readonly billing_notification_mail_service: BillingNotificationMailService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { request, user } = getGuardRequest(context);
    if (!user?.profile) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const profile_id = user.id;
    const role = user.profile.role;
    if (!role?.id) {
      throw new UnauthorizedException("Rol no encontrado");
    }

    if (role.is_admin || role.is_developer) {
      const entitlements = await this.entitlements_service.resolve(profile_id);
      request.vehicle_listings_used = entitlements.listings_used;
      request.vehicle_listings_max = undefined;
      return true;
    }

    try {
      const entitlements =
        await this.entitlements_service.assertCanCreateListing(profile_id);
      request.vehicle_listings_used = entitlements.listings_used;
      request.vehicle_listings_max = entitlements.quotas.max_listings;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        const entitlements = await this.entitlements_service.resolve(profile_id);
        await this.billing_notification_mail_service.enqueueListingLimitReached({
          profile_id,
          max_listings: entitlements.quotas.max_listings,
          listings_used: entitlements.listings_used,
          plan_name: entitlements.plan_name,
        });
      }
      throw error;
    }
  }
}

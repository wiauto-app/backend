import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";

import { REQUIRE_SUBSCRIPTION_KEY } from "../decorators/require-subscription.decorator";
import { EntitlementsService } from "../services/entitlements.service";

/**
 * Exige suscripción activa (propia o del owner del dealership) o `users.is_admin`.
 * Solo actúa si la ruta tiene `@RequireSubscription()`.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements_service: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) {
      return true;
    }

    const { user } = getGuardRequest(context);
    if (!user) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    if (user.is_admin) {
      return true;
    }

    const profile_id = user.profile?.id ?? user.id;
    const resolved = await this.entitlements_service.resolve(profile_id);
    if (
      resolved.source === "subscription" ||
      resolved.source === "dealership_owner"
    ) {
      return true;
    }

    throw new ForbiddenException("Se requiere una suscripción activa");
  }
}

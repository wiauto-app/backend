import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { getGuardRequest } from "@/src/contexts/shared/guardRequest/getGuardRequest";

import { REQUIRE_ENTITLEMENT_KEY } from "../decorators/require-entitlement.decorator";
import { EntitlementsService } from "../services/entitlements.service";
import { getBooleanFromEntitlement, getLimitFromEntitlement } from "../types/entitlement-resolve";
import { ENTITLEMENT_VALUE_TYPE } from "../types/entitlement-features";

/**
 * Exige un entitlement concreto vía `@RequireEntitlement('feature')`, o `users.is_admin`.
 */
@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlements_service: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const feature = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRE_ENTITLEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!feature) {
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
    const entitlement = resolved.features[feature];

    if (!entitlement) {
      throw new ForbiddenException(`No tienes acceso a: ${feature}`);
    }

    if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.UNLIMITED) {
      return true;
    }

    if (entitlement.value_type === ENTITLEMENT_VALUE_TYPE.BOOLEAN) {
      if (getBooleanFromEntitlement(entitlement)) {
        return true;
      }
      throw new ForbiddenException(`No tienes acceso a: ${feature}`);
    }

    const limit = getLimitFromEntitlement(entitlement);
    if (limit === null || limit > 0) {
      return true;
    }

    throw new ForbiddenException(`No tienes acceso a: ${feature}`);
  }
}

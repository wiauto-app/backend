import { SetMetadata } from "@nestjs/common";

import type { EntitlementFeature } from "../types/entitlement-features";

export const REQUIRE_ENTITLEMENT_KEY = "require_entitlement";

/** Feature que EntitlementGuard debe comprobar (o admin bypass). */
export const RequireEntitlement = (
  feature: EntitlementFeature | string,
): MethodDecorator & ClassDecorator =>
  SetMetadata(REQUIRE_ENTITLEMENT_KEY, feature);

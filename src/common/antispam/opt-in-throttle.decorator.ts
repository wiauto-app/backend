import {
  applyDecorators,
  type ExecutionContext,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { ALL_THROTTLER_NAMES, type ThrottlerName } from "./throttler-names";

const OPT_IN_THROTTLER_METADATA = "antispam:opt-in-throttler";

export interface OptInThrottleOptions {
  limit: number;
  ttl: number;
}

/**
 * Aplica SOLO el throttler indicado (por IP, ver `getTracker` en AppModule) y
 * omite todos los demás. Pensado para throttlers registrados con
 * `skipIf: skipUnlessOptedIn(name)`: así no afectan a controladores que ya usan
 * `ThrottlerGuard` sin conocerlos.
 */
export const OptInThrottle = (
  name: ThrottlerName,
  options: OptInThrottleOptions,
): ClassDecorator & MethodDecorator =>
  applyDecorators(
    SetMetadata(OPT_IN_THROTTLER_METADATA, name),
    UseGuards(ThrottlerGuard),
    SkipThrottle(
      Object.fromEntries(
        ALL_THROTTLER_NAMES.filter(other => other !== name).map(other => [
          other,
          true,
        ]),
      ),
    ),
    Throttle({ [name]: options }),
  );

/**
 * `skipIf` para throttlers opt-in: se omite salvo que el handler o el
 * controlador lo haya activado con `@OptInThrottle(name, …)`.
 */
export const skipUnlessOptedIn =
  (name: ThrottlerName) =>
  (context: ExecutionContext): boolean => {
    const opted_in: unknown =
      Reflect.getMetadata(OPT_IN_THROTTLER_METADATA, context.getHandler()) ??
      Reflect.getMetadata(OPT_IN_THROTTLER_METADATA, context.getClass());

    return opted_in !== name;
  };

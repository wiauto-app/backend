import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

/**
 * Requiere que el request haya pasado por `VehicleCreationGuard` (o lógica que rellene el request).
 * - Sin argumento o `'used'`: anuncios actuales del perfil.
 * - `'max'`: tope del plan según `value` del permiso (undefined si admin/developer).
 */
export const VehicleCount = createParamDecorator(
  (data: "used" | "max" | undefined, ctx: ExecutionContext): number | undefined => {
    const request = ctx.switchToHttp().getRequest<
      Request & {
        vehicle_listings_used?: number;
        vehicle_listings_max?: number;
      }
    >();
    if (data === "max") {
      return request.vehicle_listings_max;
    }
    return request.vehicle_listings_used;
  },
);

import { Controller, Get, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { VehicleSpecs, VehicleSpecsService } from "../services/vehicle-specs.service";
import { envs } from "@/src/common/envs";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { VEHICLE_SPECS_ROUTE } from "../route.constants";

/**
 * Ficha técnica por versión (datos de catálogo, sin datos de usuario; en caché
 * fría la infiere un LLM con búsqueda web, ver VehicleSpecsService).
 * Admite invitados del formulario de publicación; el throttle `guest-publish-lookup`
 * se omite para usuarios autenticados (`skipIf` en AppModule).
 */
@Controller(VEHICLE_SPECS_ROUTE)
@UseGuards(OptionalJwtGuard, ThrottlerGuard)
@SkipThrottle({
  "vehicle-ai": true,
  "ai-search-filters": true,
  "support-tickets": true,
  "vehicle-identification": true,
  "guest-temp-upload": true,
  "guest-publish-ai": true,
})
@Throttle({
  "guest-publish-lookup": {
    limit: envs.GUEST_PUBLISH_LOOKUP_THROTTLE_LIMIT,
    ttl: envs.GUEST_PUBLISH_LOOKUP_THROTTLE_TTL_MS,
  },
})
export class VehicleSpecsController {
  constructor(
    private readonly vehicleSpecsService: VehicleSpecsService,
  ) {}

  @Get(":versionId")
  async getVehicleSpecs(@Param("versionId", ParseIntPipe) versionId: number): Promise<VehicleSpecs> {
    return await this.vehicleSpecsService.getVehicleSpecs(versionId);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { SkipThrottle, Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { envs } from "@/src/common/envs";
import { OptionalJwtGuard } from "@/src/contexts/auth/guards/optional-jwt.guard";
import { LookupVehicleIdentificationHttpDto } from "@/src/contexts/vehicles/dto/lookup-vehicle-identification.http-dto";
import {
  V1_VEHICLES,
  V1_VEHICLES_IDENTIFICATION,
  V1_VEHICLES_IDENTIFICATION_AVAILABILITY,
  V1_VEHICLES_IDENTIFICATION_LOOKUP,
} from "@/src/contexts/vehicles/api/route.constants";
import { VehicleIdentificationService } from "@/src/contexts/vehicles/services/vehicle-identification.service";
import type { VehicleIdentificationAvailabilityResult } from "@/src/contexts/vehicles/services/vehicle-identification.service";

/**
 * Consulta de matrícula/VIN para autocompletar el formulario de publicación.
 * Admite invitados; el throttle `guest-publish-lookup` se omite si hay sesión.
 */
@Controller(`${V1_VEHICLES}/${V1_VEHICLES_IDENTIFICATION}`)
@UseGuards(OptionalJwtGuard, ThrottlerGuard)
@SkipThrottle({
  "vehicle-ai": true,
  "ai-search-filters": true,
  "support-tickets": true,
  "guest-temp-upload": true,
  "guest-publish-ai": true,
})
@Throttle({
  "vehicle-identification": {
    limit: envs.VEHICLE_IDENTIFICATION_THROTTLE_LIMIT,
    ttl: envs.VEHICLE_IDENTIFICATION_THROTTLE_TTL_MS,
  },
  "guest-publish-lookup": {
    limit: envs.GUEST_PUBLISH_LOOKUP_THROTTLE_LIMIT,
    ttl: envs.GUEST_PUBLISH_LOOKUP_THROTTLE_TTL_MS,
  },
})
export class VehicleIdentificationController {
  constructor(
    private readonly vehicle_identification_service: VehicleIdentificationService,
  ) {}

  @Get(V1_VEHICLES_IDENTIFICATION_AVAILABILITY)
  @HttpCode(HttpStatus.OK)
  getAvailability(): Promise<VehicleIdentificationAvailabilityResult> {
    return this.vehicle_identification_service.getAvailability();
  }

  @Post(V1_VEHICLES_IDENTIFICATION_LOOKUP)
  @HttpCode(HttpStatus.OK)
  run(@Body() body: LookupVehicleIdentificationHttpDto) {
    return this.vehicle_identification_service.lookup(body);
  }
}

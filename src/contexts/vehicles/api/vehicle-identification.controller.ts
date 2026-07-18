import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

import { envs } from "@/src/common/envs";
import { JwtGuard } from "@/src/contexts/auth/guards/auth.guard";
import { LookupVehicleIdentificationHttpDto } from "@/src/contexts/vehicles/dto/lookup-vehicle-identification.http-dto";
import {
  V1_VEHICLES,
  V1_VEHICLES_IDENTIFICATION,
  V1_VEHICLES_IDENTIFICATION_AVAILABILITY,
  V1_VEHICLES_IDENTIFICATION_LOOKUP,
} from "@/src/contexts/vehicles/api/route.constants";
import { VehicleIdentificationService } from "@/src/contexts/vehicles/services/vehicle-identification.service";
import type { VehicleIdentificationAvailabilityResult } from "@/src/contexts/vehicles/services/vehicle-identification.service";

@Controller(`${V1_VEHICLES}/${V1_VEHICLES_IDENTIFICATION}`)
@UseGuards(JwtGuard, ThrottlerGuard)
@Throttle({
  "vehicle-identification": {
    limit: envs.VEHICLE_IDENTIFICATION_THROTTLE_LIMIT,
    ttl: envs.VEHICLE_IDENTIFICATION_THROTTLE_TTL_MS,
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
